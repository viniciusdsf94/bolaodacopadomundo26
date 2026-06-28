import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Forçar atualização do PWA assim que houver uma nova versão disponível
if ("serviceWorker" in navigator) {
  let lastCheck = 0;
  const checkForUpdates = () => {
    const now = Date.now();
    // Throttle: checar no máximo a cada 10 segundos para não sobrecarregar
    if (now - lastCheck > 10000) {
      lastCheck = now;
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().catch((err) => {
          console.warn("Erro ao buscar atualização do SW:", err);
        });
      });
    }
  };

  // Checar no carregamento inicial
  checkForUpdates();

  // Checar quando o usuário interage (clica) ou quando o app volta para primeiro plano
  document.addEventListener("click", checkForUpdates);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForUpdates();
    }
  });
  window.addEventListener("focus", checkForUpdates);

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
