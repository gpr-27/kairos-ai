import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import App from '@/App';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { env } from '@/lib/env';
import { ThemeProvider } from '@/providers/theme-provider';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <ClerkProvider
        publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: 'hsl(263, 80%, 65%)',
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark" storageKey="kairos-theme">
            <BrowserRouter>
              <App />
              <Toaster
                position="bottom-right"
                theme="dark"
                richColors
                closeButton
                toastOptions={{
                  style: {
                    background: 'hsl(240 10% 5.9%)',
                    color: 'hsl(0 0% 98%)',
                    border: '1px solid hsl(240 3.7% 15.9%)',
                  },
                }}
              />
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
