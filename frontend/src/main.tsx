import App from './App.tsx';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';

const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  Sentry.captureException(error || new Error(String(message)));
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason || new Error('Unhandled Promise rejection'));
});

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  
  root.render(
    <StrictMode>
      <Sentry.ErrorBoundary fallback={<div>Une erreur est survenue</div>}>
        <App />
      </Sentry.ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error("Élément racine introuvable");
}
