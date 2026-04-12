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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
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
  </React.StrictMode>
);
