import { registerApplication, start, LifeCycles } from 'single-spa';
//import { setupInactivityTimer } from './assets/js/inactivityTimer';

const apiUrl = process.env['API_URL'];
const basePath = process.env['BASE_PATH'];
const TIMEOUT = process.env['TIMEOUT'];

if (globalThis.location.pathname === '/') {
  globalThis.history.pushState({}, '', '/gym/auth');
}

if (globalThis.location.pathname === '/gym/') {
  globalThis.history.pushState({}, '', '/gym/hub/home');
}

registerApplication({
  name: 'Truck_Mf_Home',
  app: () =>
    System.import<LifeCycles>(
      process.env['NAME'] === 'local'
        ? `${apiUrl}:4201/main.js`
        : `${apiUrl}/truck/truck-mf-home/main.js`
    ),
  activeWhen: [(location) => location.pathname.startsWith(`${basePath}/hub`)],
});

registerApplication({
  name: 'Truck_Mf_Auth',
  app: () =>
    System.import<LifeCycles>(
      process.env['NAME'] === 'local'
        ? `${apiUrl}:4200/main.js`
        : `${apiUrl}/truck/truck-mf-auth/main.js`
    ),
  activeWhen: [(location) => location.pathname.startsWith(`${basePath}/auth`)],
});

registerApplication({
  name: 'Truck_Mf_Site',
  app: () =>
    System.import<LifeCycles>(
      process.env['NAME'] === 'local'
        ? `${apiUrl}:4202/main.js`
        : `${apiUrl}/truck/truck-mf-site/main.js`
    ),
  activeWhen: [(location) => location.pathname.startsWith(`${basePath}/site`)],
});

//setupInactivityTimer(TIMEOUT, '/truck/auth');
start({
  urlRerouteOnly: true,
});
