import React from 'react';

export default function Footer(){
  return (
    <footer className="mt-5 pt-4 border-top">
      <div className="text-center text-muted">&copy; {new Date().getFullYear()} Mi Tienda - Proyecto PPS</div>
    </footer>
  );
}
