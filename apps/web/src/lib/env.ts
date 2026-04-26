import { z } from 'zod';

const envSchema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'VITE_CLERK_PUBLISHABLE_KEY is required'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:4000'),
  VITE_ML_BASE_URL: z.string().url().default('http://localhost:8000'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ML_BASE_URL: import.meta.env.VITE_ML_BASE_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
});

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error(
    'Invalid environment variables. Did you copy config/root/.env.example to .env.local and fill it in?',
  );
}

export const env = parsed.data;
