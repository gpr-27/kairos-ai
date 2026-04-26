import { Schema, model, type InferSchemaType } from 'mongoose';

const submissionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    problemId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'running',
        'accepted',
        'wrong_answer',
        'time_limit',
        'memory_limit',
        'runtime_error',
        'compile_error',
        'internal_error',
      ],
      required: true,
      index: true,
    },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    runtimeMs: { type: Number },
  },
  { timestamps: true },
);

submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });

export type SubmissionDocument = InferSchemaType<typeof submissionSchema> & { _id: unknown };

export const SubmissionModel = model('Submission', submissionSchema);
