import { useEffect, useRef } from 'react';

export default function useRevealOnScroll(containerRef, options) {
  const seenRef = useRef(new WeakSet());

  useEffect(() => {
    const root = containerRef?.current || document;
    if (!root) return;

    const isInViewport = (el) => {
      if (!el || !el.getBoundingClientRect) return false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      return r.bottom >= 0 && r.right >= 0 && r.top <= vh && r.left <= vw;
    };

    const addVisibleGuarded = (el) => {
      const html = document.documentElement;
      if (html.classList.contains('no-anim')) {
        // esperar a que termine la ventana sin animaciones para evitar pops
        setTimeout(() => el.classList.add('reveal--visible'), 320);
      } else {
        el.classList.add('reveal--visible');
      }
    };

    const selector =
      options?.selector ||
      [
        '.reveal',
        '[data-reveal]',
        '.MuiCard-root',
        '.MuiPaper-root',
        '.MuiTableContainer-root',
        '.MuiTable-root',
        '.MuiTableRow-root',
        '.MuiTableCell-root',
        '.MuiGrid-root > .MuiGrid-item',
        'section',
        'article'
      ].join(', ');

    const fadeOnlySelector = [
      '.MuiTableContainer-root',
      '.MuiTable-root',
      '.MuiTableRow-root',
      '.MuiTableCell-root',
      '.MuiGrid-root > .MuiGrid-item',
      '.MuiContainer-root',
      '.MuiImageListItem-root',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th'
    ].join(', ');

    let nodes = Array.from(root.querySelectorAll(selector));

    // Fallback: si no encontramos nodos, usar hijos directos del contenedor
    if (nodes.length === 0 && root instanceof HTMLElement) {
      nodes = Array.from(root.children).filter((n) => n && n.nodeType === 1);
    }

    const staggerEnabled = options?.stagger !== false;
    const stepMs = options?.staggerStepMs ?? 20; // más rápido
    const maxMs = options?.staggerMaxMs ?? 160; // límite inferior por defecto
    const rowSelector = '.MuiTableRow-root, tr';

    // add base class to targets that don't already declare one
    const setupNode = (n, idx = 0) => {
      if (seenRef.current.has(n)) return;
      const useFadeOnly = n.matches && n.matches(fadeOnlySelector);
      const baseClass = useFadeOnly ? 'reveal-fade' : 'reveal';
      if (!n.classList.contains(baseClass) && !n.hasAttribute('data-reveal')) {
        n.classList.add(baseClass);
      }
      if (staggerEnabled) {
        // En tablas largas, permitir un máximo un poco mayor para un ingreso más suave
        const localMax = n.matches && n.matches(rowSelector) ? 220 : maxMs;
        const delay = Math.min(idx * stepMs, localMax);
        n.style.transitionDelay = `${delay}ms`;
      }
      seenRef.current.add(n);
      if (isInViewport(n)) {
        addVisibleGuarded(n);
      } else {
        io.observe(n);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            addVisibleGuarded(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0,
        ...options,
      }
    );

    nodes.forEach((n, i) => setupNode(n, i));

    // Mutation observer para elementos que se agregan luego (tablas/filas cargadas async)
    const mo = new MutationObserver((mutations) => {
      let index = nodes.length;
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return; // ELEMENT_NODE
          const el = node;
          // si el propio nodo coincide
          if (el.matches && el.matches(selector)) {
            setupNode(el, index++);
          }
          // y sus descendientes
          const children = el.querySelectorAll ? el.querySelectorAll(selector) : [];
          children.forEach((child) => setupNode(child, index++));
        });
      }
    });
    mo.observe(root, { childList: true, subtree: true });

    // Safety fallback: ensure anything currently in viewport becomes visible soon
    const safetyId = setTimeout(() => {
      nodes.forEach((n) => {
        if (!n.classList.contains('reveal--visible') && isInViewport(n)) {
          addVisibleGuarded(n);
        }
      });
    }, 400);

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(safetyId);
    };
  }, [containerRef, options]);
}
