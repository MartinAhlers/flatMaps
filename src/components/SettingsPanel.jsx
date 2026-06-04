import React from 'react';

export default function SettingsPanel({
  isOpen,
  onClose,
  orsKey,
  setOrsKey,
  slopeThreshold,
  setSlopeThreshold
}) {
  if (!isOpen) return null;

  return (
    <div className="settings-modal">
      <div className="settings-header">
        <span>Ajustes de Navegación</span>
        <button className="settings-close" onClick={onClose}>
          &times;
        </button>
      </div>

      {/* Control de Pendiente para "Repechos" */}
      <div className="slider-group">
        <div className="slider-header">
          <span>Umbral de Pendiente Máxima</span>
          <span className="slider-val">{slopeThreshold}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="15"
          step="1"
          className="range-input"
          value={slopeThreshold}
          onChange={(e) => setSlopeThreshold(parseInt(e.target.value))}
        />
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '2px' }}>
          Las subidas con inclinación superior a este porcentaje serán marcadas como "repechos empinados".
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '5px 0' }} />

      {/* Openrouteservice API Key */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Openrouteservice API Key (Opcional)</span>
          <a
            href="https://openrouteservice.org/dev/#/signup"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontSize: '0.72rem' }}
          >
            Obtener gratis
          </a>
        </label>
        <input
          type="password"
          className="form-input"
          style={{ paddingLeft: '12px' }}
          placeholder="Pegar tu clave API aquí..."
          value={orsKey}
          onChange={(e) => setOrsKey(e.target.value)}
        />
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '6px' }}>
          Configura una clave de <strong>Openrouteservice</strong> para realizar consultas de enrutamiento globales ilimitadas y de alta precisión con elevación integrada.
        </div>
      </div>

      {orsKey ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>API Key cargada (Usando ORS Engine)</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Modo básico (OSRM + Open-Meteo)</span>
        </div>
      )}
    </div>
  );
}
