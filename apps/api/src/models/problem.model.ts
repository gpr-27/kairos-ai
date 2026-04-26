import { Schema, model, type InferSchemaType } from 'mongoose';

const exampleSchema = new Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false },
);

const testCaseSchema = new Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    explanation: { type: String },
  },
  { _id: false },
);

const problemSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    track: {
      type: String,
      enum: ['dsa', 'cp', 'system_design'],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },
    topics: { type: [String], default: [], index: true },
    description: { type: String, required: true },
    constraints: { type: [String], default: [] },
    examples: { type: [exampleSchema], default: [] },
    testCases: { type: [testCaseSchema], default: [] },
    starterCode: {
      type: Map,
      of: String,
      default: () => new Map<string, string>(),
    },
    hints: { type: [String], default: [] },
    editorial: { type: String },
    source: { type: String },
  },
  { timestamps: true },
);

problemSchema.index({ title: 'text', topics: 'text' });

export type ProblemDocument = InferSchemaType<typeof problemSchema> & { _id: unknown };

export const ProblemModel = model('Problem', problemSchema);
