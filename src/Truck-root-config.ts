import { registerApplication, start, LifeCycles } from 'single-spa';
//import { setupInactivityTimer } from './assets/js/inactivityTimer';

const apiUrl = process.env['API_URL'];
const basePath = process.env['BASE_PATH'];
const TIMEOUT = process.env['TIMEOUT'];

const isLocal = process.env['NAME'] === 'local';

const authEntryUrl = isLocal
  ? `${apiUrl}:4200/main.js`
  : `${apiUrl}/truck/truck-mf-auth/main.js`;

const siteEntryUrl = isLocal
  ? `${apiUrl}:4202/main.js`
  : `${apiUrl}/truck/truck-mf-site/main.js`;

if (globalThis.location.pathname === '/') {
  globalThis.history.pushState({}, '', '/truck/auth');
}

if (globalThis.location.pathname === '/truck/') {
  globalThis.history.pushState({}, '', '/truck/site/home');
}

registerApplication({
  name: 'Truck_Mf_Auth',
  app: () => System.import<LifeCycles>(authEntryUrl),
  activeWhen: [(location) => location.pathname.startsWith(`${basePath}/auth`)],
});

registerApplication({
  name: 'Truck_Mf_Site',
  app: () => System.import<LifeCycles>(siteEntryUrl),
  activeWhen: [(location) => location.pathname.startsWith(`${basePath}/site`)],
});

//setupInactivityTimer(TIMEOUT, '/truck/auth');
start({
  urlRerouteOnly: true,
});

/**
 * Adelanta la descarga del bundle del Site mientras el usuario esta en el
 * login.
 *
 * Sin esto el navegador no toca ese archivo hasta que la ruta cambia, asi que
 * el usuario mira una pantalla en blanco mientras bajan varios cientos de KB
 * que se podrian haber traido durante el tiempo muerto en que escribe su
 * correo y su contrasena.
 *
 * Es solo un `<link rel="prefetch">`, y esa eleccion importa:
 *
 * - Descarga en la prioridad mas baja del navegador y lo deja en la cache
 *   HTTP. No evalua el modulo, de modo que no ocupa el hilo principal y el
 *   formulario de login no se traba.
 * - No pasa por SystemJS ni por single-spa, asi que no puede alterar el estado
 *   de ninguno de los dos.
 * - Si falla, no pasa nada. Cuando la ruta cambie, SystemJS pedira el archivo
 *   como siempre.
 *
 * Deliberadamente NO se usa `System.import` aqui. Ese si evaluaria el bundle
 * completo encima de la pantalla de login, y un fallo quedaria registrado en
 * SystemJS antes de que el usuario navegue de verdad.
 */
function prefetchSiteBundle(): void {
  // Ya se esta en el Site: el bundle se esta cargando de todas formas.
  if (globalThis.location.pathname.startsWith(`${basePath}/site`)) {
    return;
  }

  // Respeta el ahorro de datos y las redes lentas: en esos casos adelantar la
  // descarga estorba mas de lo que ayuda.
  const connection = (navigator as any).connection;
  if (connection?.saveData) {
    return;
  }
  if (/2g/.test(connection?.effectiveType ?? '')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'script';
  link.href = siteEntryUrl;
  document.head.appendChild(link);
}

// Despues del `load` y en tiempo ocioso, para no competir con nada de lo que
// necesita la pantalla de login.
globalThis.addEventListener('load', () => {
  if (typeof globalThis.requestIdleCallback === 'function') {
    globalThis.requestIdleCallback(prefetchSiteBundle, { timeout: 5000 });
  } else {
    // Safari todavia no implementa requestIdleCallback.
    globalThis.setTimeout(prefetchSiteBundle, 2000);
  }
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
