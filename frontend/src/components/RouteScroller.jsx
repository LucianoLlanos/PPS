import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

// Scroller inteligente: evita "pantallazos" desactivando transiciones brevemente
// y usando un scroll instantáneo. Esto reduce repaints pesados en páginas con
// muchas imágenes/componentes.
export default function RouteScroller() {
  const { pathname } = useLocation();
  const isHomePath = pathname === '/';
  const [visible, setVisible] = useState(isHomePath); // en Home, visible desde el primer render
  const visibleStartRef = useRef(0);
  useEffect(() => {
    const root = document.documentElement;
    const isHome = pathname === '/';
    const SHOW_DELAY_MS = isHome ? 0 : 280; // en inicio sin demora adicional
    const MIN_VISIBLE_MS = isHome ? 650 : 350; // en inicio permanece un poco más
    const NO_ANIM_DURATION_MS = isHome ? 420 : 260; // en inicio extendemos ventana sin animaciones
    // Mostrar overlay solo si la transición tarda más de SHOW_DELAY_MS
    const showTimer = setTimeout(() => {
      setVisible(true);
      visibleStartRef.current = Date.now();
    }, SHOW_DELAY_MS);
    root.classList.add('no-anim');
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }
    catch { window.scrollTo(0, 0); }
    if (isHome && visible && !visibleStartRef.current) {
      visibleStartRef.current = Date.now();
    }
    const t = setTimeout(() => {
      root.classList.remove('no-anim');
      clearTimeout(showTimer);
      // Respetar un tiempo mínimo visible para evitar parpadeo si ya apareció
      const elapsed = visibleStartRef.current ? (Date.now() - visibleStartRef.current) : 0;
      const extraDelay = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => {
        setVisible(false);
        visibleStartRef.current = 0;
      }, 120 + extraDelay);
    }, NO_ANIM_DURATION_MS);
      return () => {
        clearTimeout(t);
        clearTimeout(showTimer);
      };
  }, [pathname]);
  if (!visible) return null;
  return createPortal(
    <div className={`route-loader-overlay${pathname === '/' ? ' route-loader-overlay--strong' : ''}`} role="status" aria-live="polite" aria-label="Cargando">
      <div className="route-loader" aria-hidden="true">
        <div className="route-loader-ring" />
        <img className="route-loader-logo" src="/logo.jpeg" alt="Logo" />
      </div>
    </div>,
    document.body
  );
}
