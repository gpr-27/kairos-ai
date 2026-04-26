/**
 * In dev, when the app is opened via ngrok, a LAN host, etc., the browser must not
 * use localhost:4000/8000 — that refers to the visitor's machine, not the dev box.
 * Instead we same-origin to Vite and let server.proxy forward to local services.
 */
import { env } from './env';

const API_PROXY_PREFIX = '/_kairos/api';
const ML_PROXY_PREFIX = '/_kairos/ml';

function shouldProxyViaVite(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h !== 'localhost' && h !== '127.0.0.1' && h !== '::1';
}

export function getApiBaseUrl(): string {
  if (shouldProxyViaVite()) {
    return `${window.location.origin}${API_PROXY_PREFIX}`;
  }
  return env.VITE_API_BASE_URL;
}

export function getMlBaseUrl(): string {
  if (shouldProxyViaVite()) {
    return `${window.location.origin}${ML_PROXY_PREFIX}`;
  }
  return env.VITE_ML_BASE_URL;
}
