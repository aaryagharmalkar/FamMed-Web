import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { FamilyProvider } from './context/FamilyContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { hasSupabaseEnv, supabaseConfigError } from './lib/supabaseClient';

const setupScrollAnimations = () => {
  const selector = '.card, .section-title, .feature-item, .step';
  const seen = new WeakSet();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('animate-fade-up');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );

  const watch = () => {
    document.querySelectorAll(selector).forEach((element) => {
      if (seen.has(element)) return;
      seen.add(element);
      observer.observe(element);
    });
  };

  watch();
  const mo = new MutationObserver(watch);
  mo.observe(document.body, { childList: true, subtree: true });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hasSupabaseEnv ? (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <FamilyProvider>
                <NotificationProvider>
                  <App />
                  <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
                </NotificationProvider>
              </FamilyProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
        <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h1 className="text-xl font-semibold">Setup Required</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{supabaseConfigError}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
            <li>Create a <strong>.env</strong> file in the project root.</li>
            <li>Copy values from <strong>.env.example</strong>.</li>
            <li>Set real values for <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong>.</li>
            <li>Restart the dev server.</li>
          </ol>
        </div>
      </div>
    )}
  </React.StrictMode>
);

setupScrollAnimations();
