// ============================================================
// OneFlesh — Application Entry Point
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          (error.status === 401 || error.status === 403)
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff9f4',
              color: '#3d1a1e',
              border: '1px solid rgba(107, 15, 26, 0.15)',
              borderRadius: '0.75rem',
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.875rem',
              boxShadow: '0 8px 40px rgba(74, 10, 18, 0.14)',
            },
            success: {
              iconTheme: {
                primary: '#c9a84c',
                secondary: '#fff9f4',
              },
            },
            error: {
              iconTheme: {
                primary: '#6b0f1a',
                secondary: '#fff9f4',
              },
            },
          }}
        />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
);
