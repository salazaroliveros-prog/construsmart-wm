'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered: ', registration);

            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('New content is available; please refresh.');
                      // You could show a notification to the user here
                    } else {
                      console.log('Content is cached for offline use.');
                    }
                  }
                };
              }
            };
          })
          .catch((registrationError) => {
            console.log('Service Worker registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return null;
}
