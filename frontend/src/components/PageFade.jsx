import React, { useEffect, useRef } from 'react';
import useRevealOnScroll from '../hooks/useRevealOnScroll';

export default function PageFade({ children }) {
  const ref = useRef(null);
  useRevealOnScroll(ref);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => el.classList.add('page-fade-in'));
  }, []);

  return (
    <div ref={ref} className="page-fade-fade-only" data-reveal-scope>
      {children}
    </div>
  );
}
