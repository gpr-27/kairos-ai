import {
  PISTON_LANGUAGE_MAP,
  type Language,
  type RunCodeResponse,
  type SubmissionStatus,
  type TestCaseResult,
} from '@kairos/types';

import { logger } from '../config/logger.js';
import { ProblemModel } from '../models/problem.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { NotFoundError } from '../errors/app-error.js';
import { executeCode } from './piston.service.js';

interface RunCodeArgs {
  userId: string;
  problemId: string;
  language: Language;
  code: string;
}

function determineStatus(
  passed: number,
  total: number,
  hasRuntimeErr: boolean,
  hasCompileErr: boolean,
): SubmissionStatus {
  if (hasCompileErr) return 'compile_error';
  if (hasRuntimeErr) return 'runtime_error';
  if (total === 0) return 'internal_error';
  if (passed === total) return 'accepted';
  return 'wrong_answer';
}

async function runTests(
  tests: { input: string; expectedOutput: string }[],
  pistonLang: string,
  code: string,
  startIndex: number,
  exposeDetails: boolean,
): Promise<{
  results: TestCaseResult[];
  passedCount: number;
  totalRuntimeMs: number;
  firstCompileErr: string | undefined;
  firstRuntimeErr: string | undefined;
  aborted: boolean;
}> {
  const results: TestCaseResult[] = [];
  let passedCount = 0;
  let totalRuntimeMs = 0;
  let firstCompileErr: string | undefined;
  let firstRuntimeErr: string | undefined;
  let aborted = false;

  for (let i = 0; i < tests.length; i += 1) {
    const test = tests[i];
    if (!test) continue;
    try {
      const exec = await executeCode({
        language: pistonLang,
        code,
        stdin: test.input,
      });

      if (exec.compileError && !firstCompileErr) firstCompileErr = exec.compileError;
      if (exec.exitCode !== 0 && exec.stderr && !firstRuntimeErr) firstRuntimeErr = exec.stderr;

      const actualOutput = exec.stdout.trim();
      const expectedOutput = test.expectedOutput.trim();
      const passed = !exec.compileError && exec.exitCode === 0 && actualOutput === expectedOutput;

      if (passed) passedCount += 1;
      totalRuntimeMs += exec.runtimeMs ?? 0;

      results.push({
        index: startIndex + i,
        passed,
        // Hide sensitive data for hidden test cases
        input: exposeDetails ? test.input : '[hidden]',
        expectedOutput: exposeDetails ? expectedOutput : '[hidden]',
        actualOutput: exposeDetails ? actualOutput : passed ? '[correct]' : '[incorrect]',
        ...(exposeDetails && exec.stderr ? { stderr: exec.stderr } : {}),
        ...(exec.runtimeMs !== undefined ? { runtimeMs: exec.runtimeMs } : {}),
      });

      if (exec.compileError) {
        aborted = true;
        break;
      }
    } catch (err) {
      logger.warn({ err, testIndex: startIndex + i }, 'Test execution failed');
      const stderr = err instanceof Error ? err.message : 'Sandbox execution failed';
      if (!firstRuntimeErr) firstRuntimeErr = stderr;
      results.push({
        index: startIndex + i,
        passed: false,
        input: exposeDetails ? test.input : '[hidden]',
        expectedOutput: exposeDetails ? test.expectedOutput : '[hidden]',
        actualOutput: '',
        ...(exposeDetails ? { stderr } : {}),
      });
      aborted = true;
      break;
    }
  }

  return { results, passedCount, totalRuntimeMs, firstCompileErr, firstRuntimeErr, aborted };
}

export async function runCode(args: RunCodeArgs): Promise<RunCodeResponse> {
  const problem = await ProblemModel.findOne({ slug: args.problemId }).lean();
  if (!problem) throw new NotFoundError('Problem');

  const pistonLang = PISTON_LANGUAGE_MAP[args.language];
  const visibleTests = problem.testCases.filter((tc) => !tc.isHidden);
  const hiddenTests = problem.testCases.filter((tc) => tc.isHidden);

  // ── 1. Run visible tests (results shown to user) ────────────────────────
  const visible = await runTests(visibleTests, pistonLang, args.code, 0, true);

  let testResults: TestCaseResult[] = visible.results;
  let passedCount = visible.passedCount;
  let totalRuntimeMs = visible.totalRuntimeMs;
  const firstCompileErr = visible.firstCompileErr;
  let firstRuntimeErr = visible.firstRuntimeErr;

  // ── 2. Run hidden tests (status only, inputs/expected never exposed) ────
  if (!visible.aborted && !firstCompileErr && hiddenTests.length > 0) {
    const hidden = await runTests(
      hiddenTests,
      pistonLang,
      args.code,
      visibleTests.length,
      false, // never expose hidden test data
    );
    // Append hidden test rows so the UI shows "X/Y passed" correctly
    testResults = [...testResults, ...hidden.results];
    passedCount += hidden.passedCount;
    totalRuntimeMs += hidden.totalRuntimeMs;
    if (!firstRuntimeErr && hidden.firstRuntimeErr) firstRuntimeErr = hidden.firstRuntimeErr;
  }

  const totalCount = visibleTests.length + hiddenTests.length;
  const status = determineStatus(
    passedCount,
    totalCount,
    Boolean(firstRuntimeErr),
    Boolean(firstCompileErr),
  );

  await SubmissionModel.create({
    userId: args.userId,
    problemId: args.problemId,
    language: args.language,
    code: args.code,
    status,
    passedCount,
    totalCount,
    runtimeMs: totalRuntimeMs,
  });

  return {
    status,
    testResults,
    passedCount,
    totalCount,
    runtimeMs: totalRuntimeMs,
    ...(firstCompileErr ? { compileOutput: firstCompileErr } : {}),
    ...(firstRuntimeErr ? { stderr: firstRuntimeErr } : {}),
  };
}
