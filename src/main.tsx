import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorPages';

// Register Service Worker for PWA only in production
if ('serviceWorker' in navigator) {
  if ((import.meta as any).env?.PROD) {
    registerSW({ immediate: true });
  } else {
    // In development, unregister any stale dev service workers from dev-dist
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error('Target root element #root was not found in the DOM.');
}
