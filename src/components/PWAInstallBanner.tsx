import { useState, useEffect } from "react";
import { X, Download, Share, Plus, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "pwa-install-banner-dismissed";

// Detecta se está rodando como PWA instalado
const isRunningAsPWA = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

// Detecta iOS
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

// Detecta Android
const isAndroid = () => /android/i.test(navigator.userAgent);

// Detecta Android/Chrome com suporte ao beforeinstallprompt
let deferredPrompt: any = null;

const PWAInstallBanner = () => {
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Não mostra se já está instalado ou foi dispensado
    if (isRunningAsPWA() || sessionStorage.getItem(DISMISSED_KEY)) return;

    const ios = isIOS();
    const android = isAndroid();
    setIsIOSDevice(ios);
    setIsAndroidDevice(android);

    if (ios || android) {
      // Mostra o banner para dispositivos móveis
      setShow(true);
    }

    // Escuta o evento de instalação
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
    deferredPrompt = null;
    setCanInstall(false);
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-50 w-full bg-gradient-to-r from-green-900/95 via-emerald-800/95 to-green-900/95 backdrop-blur-xl border-b border-green-600/40 shadow-lg"
        >
          <div className="container flex items-center gap-3 py-2.5 px-4">
            {/* Ícone do app */}
            <img
              src="/pwa-192x192.png"
              alt="Bolão Copa 26"
              className="h-10 w-10 flex-shrink-0 rounded-xl object-cover shadow"
            />

            {/* Texto */}
            <div className="flex-1 min-w-0">
              {isIOSDevice ? (
                <>
                  <p className="text-sm font-semibold text-white leading-tight">
                    Instale o Bolão Copa 26
                  </p>
                  <p className="text-xs text-green-200 leading-tight mt-0.5 flex items-center gap-1 flex-wrap">
                    Toque em{" "}
                    <span className="inline-flex items-center gap-0.5 bg-white/10 rounded px-1 py-0.5 font-medium">
                      <Share className="h-3 w-3" /> Compartilhar
                    </span>{" "}
                    e depois{" "}
                    <span className="inline-flex items-center gap-0.5 bg-white/10 rounded px-1 py-0.5 font-medium">
                      <Plus className="h-3 w-3" /> Tela de Início
                    </span>
                  </p>
                </>
              ) : isAndroidDevice && !canInstall ? (
                <>
                  <p className="text-sm font-semibold text-white leading-tight">
                    Instale o Bolão Copa 26
                  </p>
                  <p className="text-xs text-green-200 leading-tight mt-0.5 flex items-center gap-1 flex-wrap">
                    Toque em{" "}
                    <span className="inline-flex items-center gap-0.5 bg-white/10 rounded px-1 py-0.5 font-medium">
                      <MoreVertical className="h-3 w-3" /> Menu
                    </span>{" "}
                    e depois{" "}
                    <span className="inline-flex items-center gap-0.5 bg-white/10 rounded px-1 py-0.5 font-medium">
                      Adicionar à tela inicial
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-white leading-tight">
                    Instale o Bolão Copa 26
                  </p>
                  <p className="text-xs text-green-200 leading-tight mt-0.5">
                    Acesse mais rápido direto da tela inicial do celular
                  </p>
                </>
              )}
            </div>

            {/* Botão de instalar (apenas quando canInstall é true) */}
            {canInstall && (
              <button
                onClick={handleInstall}
                className="flex-shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-400 active:scale-95 transition-all text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow"
              >
                <Download className="h-4 w-4" />
                Instalar
              </button>
            )}

            {/* Fechar */}
            <button
              onClick={dismiss}
              className="flex-shrink-0 rounded-full p-1 text-green-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;

