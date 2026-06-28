import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Forçar atualização do PWA assim que houver uma nova versão disponível
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.update().catch((err) => {
      console.warn("Erro ao buscar atualização do SW:", err);
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
