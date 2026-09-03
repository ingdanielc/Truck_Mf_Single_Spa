import { registerApplication, start, LifeCycles } from 'single-spa';
//import { setupInactivityTimer } from './assets/js/inactivityTimer';

const apiUrl = process.env['API_URL'];
const basePath = process.env['BASE_PATH'];
const TIMEOUT = process.env['TIMEOUT'];

if (globalThis.location.pathname === '/') {
  globalThis.history.pushState({}, '', '/truck/auth');
}

if (globalThis.location.pathname === '/truck/') {
  globalThis.history.pushState({}, '', '/truck/site/home');
}

registerApplication({
  name: 'Truck_Mf_Auth',
  app: () =>
    System.import<LifeCycles>(
      process.env['NAME'] === 'local'
        ? `${apiUrl}:4200/main.js`
        : `${apiUrl}/truck/truck-mf-auth/main.js`,
    ),
  activeWhen: [(location) => location.pathname.startsWith(`${basePath}/auth`)],
});

registerApplication({
  name: 'Truck_Mf_Site',
  app: () =>
    System.import<LifeCycles>(
      process.env['NAME'] === 'local'
        ? `${apiUrl}:4202/main.js`
        : `${apiUrl}/truck/truck-mf-site/main.js`,
    ),
  activeWhen: [(location) => location.pathname.startsWith(`${basePath}/site`)],
});

//setupInactivityTimer(TIMEOUT, '/truck/auth');
start({
  urlRerouteOnly: true,
});

// Service worker de notificaciones push. Se registra despues del `load` para no
// competir con la descarga de los micro-frontends, y solo sobre HTTPS o
// localhost (el navegador lo rechaza en http plano).
//
// No cachea nada: ver src/sw.js. Un fallo aqui no puede tumbar la app — sin
// service worker simplemente no hay push y todo lo demas sigue igual.
if ('serviceWorker' in navigator) {
  globalThis.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[push] no se pudo registrar el service worker', error);
    });
  });
}
