/**
 * LLM-powered test case generator.
 *
 * Usage:
 *   npx tsx src/scripts/generate-test-cases.ts --slug two-sum --count 10
 *   npx tsx src/scripts/generate-test-cases.ts --slug my-new-problem --title "My Problem" --description "..." --code solution.py
 *
 * What it does:
 *   1. Loads the existing problem from MongoDB (or accepts inline description)
 *   2. Asks Groq to generate N test case (input, expectedOutput) pairs
 *   3. Validates each pair by running it through the local code executor
 *   4. Persists validated test cases to the problem document in MongoDB
 */

import { parseArgs } from 'node:util';

import Groq from 'groq-sdk';

import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import { ProblemModel } from '../models/problem.model.js';
import { PISTON_LANGUAGE_MAP } from '@kairos/types';
import { executeCode } from '../services/piston.service.js';

// ─── CLI args ───────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    code: { type: 'string' }, // path to a reference solution file
    count: { type: 'string', default: '10' },
    language: { type: 'string', default: 'python' },
    hidden: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawTestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

interface ValidatedTestCase extends RawTestCase {
  validated: boolean;
  actualOutput?: string;
  error?: string;
}

// ─── Groq prompt ────────────────────────────────────────────────────────────

const GENERATOR_SYSTEM_PROMPT = `You are an expert competitive-programming problem-setter.
Your job is to generate correct test cases for a given problem.

RULES:
1. Return ONLY a valid JSON array — no prose, no code fences, no explanation.
2. Each element: { "input": "<stdin string>", "expectedOutput": "<stdout string>", "explanation": "<optional brief note>" }
3. The "input" must exactly match the stdin format the reference code expects.
4. The "expectedOutput" must exactly match what a correct solution would print (trim trailing newline).
5. Cover: empty/edge cases, single element, large numbers, all-negative, duplicates, already-sorted, etc.
6. Do NOT include test cases where the answer is ambiguous or multiple answers exist unless the format accounts for ordering.`;

function buildUserPrompt(
  title: string,
  description: string,
  starterCode: string,
  count: number,
): string {
  return `Problem: ${title}

Description:
${description}

Reference implementation (Python — read this to understand the exact stdin/stdout format):
\`\`\`python
${starterCode}
\`\`\`

Generate ${count} diverse test cases as a JSON array.
Important: match the exact stdin format shown in the reference code.`;
}

// ─── Core logic ─────────────────────────────────────────────────────────────

async function generateWithGroq(
  title: string,
  description: string,
  starterCode: string,
  count: number,
): Promise<RawTestCase[]> {
  const groqApiKey = process.env['GROQ_API_KEY'] ?? '';
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set.');
  }

  const client = new Groq({ apiKey: groqApiKey });

  logger.info({ title, count }, '[generator] Calling Groq to generate test cases…');

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: GENERATOR_SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(title, description, starterCode, count) },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const raw = response.choices[0]?.message?.content ?? '';

  // Extract JSON array from response (Groq sometimes wraps it in markdown)
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Groq response did not contain a JSON array:\n${raw}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as RawTestCase[];
  logger.info({ count: parsed.length }, '[generator] Groq returned test cases');
  return parsed;
}

async function validateTestCase(
  tc: RawTestCase,
  language: string,
  code: string,
): Promise<ValidatedTestCase> {
  const pistonLang = PISTON_LANGUAGE_MAP[language as keyof typeof PISTON_LANGUAGE_MAP] ?? language;

  try {
    const result = await executeCode({
      language: pistonLang,
      code,
      stdin: tc.input,
      timeoutMs: 5000,
    });

    const actualOutput = result.stdout.trim();
    const expectedOutput = tc.expectedOutput.trim();
    const validated = result.exitCode === 0 && !result.compileError && actualOutput === expectedOutput;

    return {
      ...tc,
      validated,
      actualOutput,
      ...(result.stderr ? { error: result.stderr } : {}),
    };
  } catch (err) {
    return {
      ...tc,
      validated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function run(): Promise<void> {
  if (!args.slug) {
    console.error('Error: --slug is required');
    process.exit(1);
  }

  await connectDatabase();

  const problem = await ProblemModel.findOne({ slug: args.slug }).lean();

  let title: string;
  let description: string;
  let starterCode: string;

  if (problem) {
    title = problem.title;
    description = problem.description;
    const codeMap =
      problem.starterCode instanceof Map
        ? Object.fromEntries(problem.starterCode.entries())
        : (problem.starterCode as Record<string, string>);
    starterCode = codeMap['python'] ?? codeMap[Object.keys(codeMap)[0] ?? ''] ?? '';
    if (!starterCode) {
      throw new Error(`Problem "${args.slug}" has no Python starter code. Add one first.`);
    }
  } else if (args.title && args.description) {
    title = args.title;
    description = args.description;
    // --code must be a path to a reference solution file; fallback to empty warns the user
    if (!args.code) {
      throw new Error(
        'When using --title and --description, you must also pass --code <path-to-reference-solution>.',
      );
    }
    const { readFileSync } = await import('fs');
    starterCode = readFileSync(args.code as string, 'utf8');
    logger.warn('[generator] Problem not found in DB — using inline args + --code file');
  } else {
    throw new Error(
      `Problem "${args.slug}" not found. Either seed it first, or pass --title, --description, and --code.`,
    );
  }

  const count = parseInt(args.count ?? '10', 10);
  const language = args.language ?? 'python';
  const isDryRun = args['dry-run'] ?? false;

  // ── 1. Generate ──────────────────────────────────────────────────────────
  const raw = await generateWithGroq(title, description, starterCode, count);

  // ── 2. Validate ──────────────────────────────────────────────────────────
  logger.info('[generator] Validating test cases by running them…');
  const validated: ValidatedTestCase[] = [];

  for (const [i, tc] of raw.entries()) {
    const result = await validateTestCase(tc, language, starterCode);
    const status = result.validated ? '✅' : '❌';
    logger.info(
      { index: i + 1, validated: result.validated, actual: result.actualOutput, expected: tc.expectedOutput },
      `${status} Test ${i + 1}`,
    );
    validated.push(result);
  }

  const passed = validated.filter((v) => v.validated);
  const failed = validated.filter((v) => !v.validated);

  logger.info(`[generator] ${passed.length}/${validated.length} test cases validated`);

  if (failed.length > 0) {
    logger.warn('[generator] Failed cases (will be excluded from DB):');
    for (const f of failed) {
      logger.warn({ input: f.input, expected: f.expectedOutput, got: f.actualOutput, error: f.error }, '  ✗');
    }
  }

  if (isDryRun) {
    console.log('\n=== DRY RUN — validated test cases ===');
    console.log(JSON.stringify(passed, null, 2));
    await disconnectDatabase();
    return;
  }

  // ── 3. Persist ───────────────────────────────────────────────────────────
  if (passed.length === 0) {
    logger.error('[generator] No test cases passed validation. Nothing saved.');
    await disconnectDatabase();
    process.exit(1);
  }

  const newTestCases = passed.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput.trim(),
    isHidden: args.hidden ?? false,
    ...(tc.explanation ? { explanation: tc.explanation } : {}),
  }));

  await ProblemModel.findOneAndUpdate(
    { slug: args.slug },
    { $push: { testCases: { $each: newTestCases } } },
    { new: true },
  );

  logger.info(
    { slug: args.slug, added: newTestCases.length },
    `✅ Added ${newTestCases.length} validated test cases to "${args.slug}"`,
  );

  await disconnectDatabase();
}

run().catch((err: unknown) => {
  logger.error({ err }, 'Generator failed');
  process.exit(1);
});
