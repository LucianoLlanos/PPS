import React, { useEffect, useRef } from 'react';
import Footer from './Footer';
import useRevealOnScroll from '../hooks/useRevealOnScroll';

export default function PageWrapper({ children }) {
  const ref = useRef(null);
  useRevealOnScroll(ref);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // trigger page enter fade once mounted
    requestAnimationFrame(() => el.classList.add('page-fade-in'));
  }, []);

  return (
    <>
      <div ref={ref} className="app-container page-fade-fade-only" data-reveal-scope>
        {children}
      </div>
      <Footer />
    </>
  );
}