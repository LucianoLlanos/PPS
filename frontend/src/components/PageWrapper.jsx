import React from 'react';
import Footer from './Footer';

export default function PageWrapper({ children }) {
  return (
    <>
      <div className="app-container">
        {children}
      </div>
      <Footer />
    </>
  );
}