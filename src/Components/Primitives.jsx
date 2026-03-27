import Icon from "./Icon";

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "gray" }) {
  return (
    <span className={`badge badge--${color}`}>{children}</span>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  className = "",
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`btn btn--${variant} btn--${size} ${className}`}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </button>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 560 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

// ─── FIELD ────────────────────────────────────────────────────────────────────
export function Field({ label, children, required }) {
  return (
    <div className="field">
      <label className={`field__label${required ? " field__label--required" : ""}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ background: bg, color }}>
        <Icon name={icon} size={22} />
      </div>
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}
