import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;
const RELOAD_DELAY = 1200;

export function PWAUpdateNotice() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    let reloadTimer: number | undefined;
    let disposed = false;
    let reloadStarted = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const checkForUpdate = () => {
      if (!registration) return;
      void registration.update().catch((error: unknown) => {
        console.warn('Failed to check for a PWA update', error);
      });
    };

    const handleWorkerStateChange = (worker: ServiceWorker) => {
      if (worker.state === 'installed' && hadController) {
        setUpdateAvailable(true);
      }
    };

    const handleUpdateFound = () => {
      const installingWorker = registration?.installing;
      if (!installingWorker) return;
      installingWorker.addEventListener('statechange', () => {
        handleWorkerStateChange(installingWorker);
      });
      handleWorkerStateChange(installingWorker);
    };

    const handleControllerChange = () => {
      if (!hadController || reloadStarted) return;

      reloadStarted = true;
      setUpdateAvailable(true);
      reloadTimer = window.setTimeout(() => window.location.reload(), RELOAD_DELAY);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', checkForUpdate);

    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((serviceWorkerRegistration) => {
        if (disposed) return;
        registration = serviceWorkerRegistration;
        registration.addEventListener('updatefound', handleUpdateFound);
        handleUpdateFound();
        checkForUpdate();
      })
      .catch((error: unknown) => {
        console.error('Service worker registration failed', error);
      });

    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      if (reloadTimer !== undefined) window.clearTimeout(reloadTimer);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', checkForUpdate);
      registration?.removeEventListener('updatefound', handleUpdateFound);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-4 z-[100] mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl border border-sky-400/30 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 shadow-2xl shadow-black/40"
      role="status"
      aria-live="polite"
    >
      <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-sky-400" aria-hidden="true" />
      <span>A new version is available. Updating...</span>
    </div>
  );
}
