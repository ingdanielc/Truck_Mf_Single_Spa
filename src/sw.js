/**
 * Service worker de CashTruck — SOLO notificaciones push.
 *
 * NO intercepta `fetch` y NO cachea nada, a proposito. Los micro-frontends se
 * cargan por SystemJS desde URLs fijas (/truck/truck-mf-site/main.js): un cache
 * aqui dejaria a los usuarios clavados en una version vieja del MFE, sin forma
 * de actualizar y sin error visible.
 *
 * Si este archivo llega a contener la palabra `caches` o un listener `fetch`,
 * esta mal. Tampoco debe reemplazarse por @angular/service-worker ni Workbox,
 * que hacen precache por defecto.
 *
 * Recuperacion: si esta version queda rota en los dispositivos, borrar el
 * archivo del servidor NO la desinstala. Se despliega `sw-killswitch.js` con
 * este mismo nombre (/sw.js) y los navegadores se desregistran solos.
 */

const DEFAULT_ICON = "/assets/images/icons/iconV1-192x192.png";
const DEFAULT_URL = "/truck/site/home";

self.addEventListener("install", () => {
  // Activa la version nueva sin esperar a que se cierren las pestañas viejas.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = readPayload(event);

  const options = {
    body: payload.body,
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_ICON,
    data: payload.data || {},
  };

  // `renotify` exige un `tag`: sin el, Chrome lanza TypeError y no muestra nada.
  if (payload.tag) {
    options.tag = payload.tag;
    options.renotify = true;
  }

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = new URL(data.url || DEFAULT_URL, self.location.origin).href;

  event.waitUntil(openApp(targetUrl));
});

/**
 * El payload puede llegar vacio o no ser JSON (pruebas desde DevTools, push de
 * verificacion de algunos navegadores). Nunca debe reventar el listener: sin
 * notificacion visible el navegador puede desregistrar la suscripcion.
 */
function readPayload(event) {
  const fallback = {
    title: "CashTruck",
    body: "Tienes una notificacion nueva",
  };

  if (!event.data) {
    return fallback;
  }

  try {
    const parsed = event.data.json();
    return {
      ...fallback,
      ...parsed,
      title: parsed.title || fallback.title,
      body: parsed.body || fallback.body,
    };
  } catch (error) {
    return { ...fallback, body: event.data.text() || fallback.body };
  }
}

/**
 * Reutiliza la pestaña que ya tenga la app abierta en vez de abrir otra. Es lo
 * que evita que el usuario termine con cinco pestañas de CashTruck.
 */
function openApp(targetUrl) {
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) {
          continue;
        }
        if ("navigate" in client) {
          return client.navigate(targetUrl).then((navigated) => {
            return navigated ? navigated.focus() : client.focus();
          });
        }
        if ("focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
    .catch(() => self.clients.openWindow(targetUrl));
}
