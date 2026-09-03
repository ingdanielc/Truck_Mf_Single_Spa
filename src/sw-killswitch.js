/**
 * KILLSWITCH — no se despliega en condiciones normales.
 *
 * Un service worker roto persiste en el dispositivo del usuario: borrar
 * /sw.js del servidor NO lo desinstala, deja corriendo la version vieja.
 *
 * Uso: copiar el contenido de este archivo sobre `src/sw.js`, construir y
 * desplegar. Cada navegador que pida /sw.js se desregistrara y recargara sus
 * pestañas, quedando como si el service worker nunca hubiera existido.
 * Despues se restaura el `sw.js` real.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      }),
  );
});
