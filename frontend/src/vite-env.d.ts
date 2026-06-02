/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  // Optional: required only in development. Production builds are same-origin.
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ML_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_LLM_PROVIDER: string;
  readonly VITE_DEFAULT_MODEL: string;
  readonly VITE_AVAILABLE_MODELS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
