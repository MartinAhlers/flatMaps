import React from 'react';

export default function RouteCard({ route, selected, onClick }) {
  const {
    name,
    badge,
    badgeType,
    distance,
    duration,
    elevationGain,
    maxSlope,
    repechosCount,
    type
  } = route;

  // Format distance
  const formatDistance = (m) => {
    return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m`;
  };

  return (
    <div
      className={`route-card ${selected ? 'selected' : ''} ${type}`}
      onClick={onClick}
    >
      <div className="route-card-header">
        <span className="route-name">{name}</span>
        {badge && (
          <span className={`badge badge-${badgeType}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="route-stats-grid">
        {/* Tiempo estimado */}
        <div className="stat-item">
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div>
            <span className="stat-value">{duration} min</span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)' }}>Caminando</span>
          </div>
        </div>

        {/* Distancia */}
        <div className="stat-item">
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
            <path d="M15 18l6-6-6-6" />
          </svg>
          <div>
            <span className="stat-value">{formatDistance(distance)}</span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)' }}>Distancia</span>
          </div>
        </div>

        {/* Elevación ganada */}
        <div className="stat-item highlight-climb">
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <div>
            <span className="stat-value">+{elevationGain} m</span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)' }}>Desnivel subida</span>
          </div>
        </div>

        {/* Inclinación máxima */}
        <div className={`stat-item ${repechosCount > 0 ? 'highlight-climb' : 'highlight-flat'}`}>
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="20" x2="18" y2="4" />
            <polyline points="14 4 18 4 18 8" />
          </svg>
          <div>
            <span className="stat-value">{maxSlope}% max</span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)' }}>Pendiente máx.</span>
          </div>
        </div>
      </div>

      {repechosCount > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#fb7185', marginTop: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Tiene <strong>{repechosCount}</strong> repecho{repechosCount > 1 ? 's' : ''} empinado{repechosCount > 1 ? 's' : ''} (&gt; 8% inclinación)</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#34d399', marginTop: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 11 12 14 22 4" />
          </svg>
          <span>Camino cómodo y plano, sin subidas pronunciadas</span>
        </div>
      )}
    </div>
  );
}
