import React, { useRef, useState, useEffect } from 'react';
import '../stylos/ExpandableText.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export default function ExpandableText({ text = '', lines = 3, className = '', contentStyle = {}, wrapperStyle = {}, useModal = false, hideToggle = false, expanded: controlledExpanded = undefined, onToggle = null, onCanToggle = null }) {
  const [openModal, setOpenModal] = useState(false);
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = typeof controlledExpanded === 'boolean' ? controlledExpanded : expandedInternal;
  const [canToggle, setCanToggle] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    const compute = () => {
      const cs = window.getComputedStyle(el);
      let lineHeight = parseFloat(cs.lineHeight);
      if (!lineHeight || Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(cs.fontSize) || 14;
        lineHeight = fontSize * 1.2;
      }
      const visibleH = Math.round(lineHeight * lines);
      const fullH = el.scrollHeight;
      const needed = fullH > visibleH + 1;
      setCanToggle(needed);
      // notify parent if it wants to know whether a toggle is needed
      if (typeof onCanToggle === 'function') {
        try { onCanToggle(needed); } catch { /* ignore handler errors */ }
      }
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [text, lines, onCanToggle]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.classList.toggle('expanded', expanded);
    wrapper.classList.toggle('clamped', !expanded);
  }, [expanded]);

  const wrapperClass = `expandable-wrap ${className} ${expanded ? 'expanded' : 'clamped'} lines-${lines}`.trim();
  const contentClass = `expandable-content ${className} ${expanded ? 'expanded' : 'clamped'} lines-${lines}`.trim();

  return (
    <div>
      <div ref={wrapperRef} className={wrapperClass} style={wrapperStyle}>
        <div ref={contentRef} className={contentClass} style={contentStyle}>
          {text}
        </div>
      </div>
      {canToggle && !hideToggle && (
        <>
          <button type="button" className="servicios-leer-mas" onClick={() => {
            if (useModal) setOpenModal(true);
            else {
              if (onToggle) onToggle(!expanded);
              else setExpandedInternal(s => !s);
            }
          }}>
            {expanded ? 'Mostrar menos' : 'Leer más'}
          </button>
          {useModal && (
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Descripción</DialogTitle>
              <DialogContent dividers>
                <div className="expandable-dialog-content">{text}</div>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenModal(false)}>Cerrar</Button>
              </DialogActions>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
