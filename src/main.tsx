import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      void navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(
          registrations
            .filter((registration) => registration.scope === `${window.location.origin}/`)
            .map((registration) => registration.unregister())
        ))
        .catch((error) => {
          console.warn('Failed to unregister the service worker in development', error);
        });
      return;
    }

    if (window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed', error);
      });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
