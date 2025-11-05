// Add this code block at the very top to unregister any zombie service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length) {
      console.log('Unregistering existing Service Workers to clear cache...');
      for (const registration of registrations) {
        registration.unregister();
      }
      // After unregistering, reload the page to ensure the changes take effect
      // and the page is loaded from the network, not the old cache.
      console.log('Reloading page after unregistering service workers.');
      window.location.reload();
    }
  }).catch((error) => {
    console.error('Service Worker unregistration failed: ', error);
  });
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import Auth from './Auth';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Auth />
  </React.StrictMode>
);