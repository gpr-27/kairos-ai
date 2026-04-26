import type { ProblemListQuery, ProblemSummary, Problem } from '@kairos/types';

import { ProblemModel, type ProblemDocument } from '../models/problem.model.js';
import { NotFoundError } from '../errors/app-error.js';

function toProblem(doc: ProblemDocument & { _id: { toString: () => string } }): Problem {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    track: doc.track as Problem['track'],
    difficulty: doc.difficulty as Problem['difficulty'],
    topics: doc.topics as Problem['topics'],
    description: doc.description,
    constraints: doc.constraints,
    examples: doc.examples.map((ex) => ({
      input: ex.input,
      output: ex.output,
      ...(ex.explanation ? { explanation: ex.explanation } : {}),
    })),
    testCases: doc.testCases
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        ...(tc.explanation ? { explanation: tc.explanation } : {}),
      })),
    starterCode: Object.fromEntries(
      doc.starterCode instanceof Map
        ? doc.starterCode.entries()
        : Object.entries(doc.starterCode ?? {}),
    ),
    hints: doc.hints,
    ...(doc.editorial ? { editorial: doc.editorial } : {}),
    ...(doc.source ? { source: doc.source } : {}),
    createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
    updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt.toISOString(),
  };
}

function toSummary(doc: ProblemDocument & { _id: { toString: () => string } }): ProblemSummary {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    track: doc.track as ProblemSummary['track'],
    difficulty: doc.difficulty as ProblemSummary['difficulty'],
    topics: doc.topics as ProblemSummary['topics'],
  };
}

export interface PaginatedProblems {
  data: ProblemSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listProblems(query: ProblemListQuery): Promise<PaginatedProblems> {
  const filter: Record<string, unknown> = {};
  if (query.track) filter.track = query.track;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.topic) filter.topics = query.topic;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { topics: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [docs, total] = await Promise.all([
    ProblemModel.find(filter)
      .sort({ difficulty: 1, createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ProblemModel.countDocuments(filter),
  ]);

  return {
    data: docs.map((doc) => toSummary(doc as never)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProblemBySlug(slug: string): Promise<Problem> {
  const doc = await ProblemModel.findOne({ slug }).lean();
  if (!doc) throw new NotFoundError('Problem');
  return toProblem(doc as never);
}
