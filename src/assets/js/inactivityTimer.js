export function setupInactivityTimer(TIMEOUT, pathnameForExclusion) {
  let timeoutId;

  function deleteCookie(name) {
    Cookies.remove(name, { path: "/", domain: ".app-truck-dev.azurewebsites.net" });
    Cookies.remove(name, { path: "/", domain: ".localhost" });
  }

  function onTimeout() {
    deleteCookie("token");
    alert("You have been inactive for 5 minutes. You will be logged out for security reasons.");
    globalThis.location.assign("/truck/auth");
  }

  function startInactivityTimer() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(onTimeout, TIMEOUT);
  }

  function resetInactivityTimer() {
    if (location.pathname !== pathnameForExclusion) {
      startInactivityTimer();
    }
  }

  ["click", "keypress", "mousemove", "scroll"].forEach((event) => {
    document.addEventListener(event, resetInactivityTimer, true);
  });

  if (location.pathname !== pathnameForExclusion) {
    startInactivityTimer();
  }
}
