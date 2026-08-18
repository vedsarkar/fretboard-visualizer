import { useEffect, useRef, useState } from 'react';

export function Btn({ active, on, className = '', children, ...rest }) {
  const classes = ['btn', active && 'is-active', on && 'is-on', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

export const Readout = ({ children }) => <span className="readout">{children}</span>;

export const Label = ({ children }) => <span className="row-label">{children}</span>;

/**
 * Click-to-open menu that closes on outside click or Escape.
 * Children receive a `close` callback.
 */
export function Dropdown({ label, title, active, menuClassName = '', children }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`dropdown${open ? ' is-open' : ''}`} ref={root}>
      <Btn active={active} title={title} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {label}
      </Btn>
      <div className={`dropdown-menu ${menuClassName}`}>{children(() => setOpen(false))}</div>
    </div>
  );
}

export function MenuItem({ active, label, detail, onClick }) {
  return (
    <button
      type="button"
      className={`menu-item${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {label}
      {detail ? <small>{detail}</small> : null}
    </button>
  );
}

export const MenuHeading = ({ children }) => <div className="menu-heading">{children}</div>;
