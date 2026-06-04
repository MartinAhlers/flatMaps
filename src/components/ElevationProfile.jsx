import React, { useRef, useState } from 'react';

export default function ElevationProfile({ route, hoveredPoint, setHoveredPoint }) {
  const profile = route?.elevationProfile || [];
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState(null);

  if (profile.length === 0) return null;

  // Find min and max values for scaling
  const elevations = profile.map((p) => p.elevation);
  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const elevRange = maxElev - minElev;

  // Add padding to y axis
  const yMin = Math.max(0, minElev - (elevRange * 0.15 || 5));
  const yMax = maxElev + (elevRange * 0.15 || 5);
  const ySpan = yMax - yMin;

  const totalDist = profile[profile.length - 1].distance;

  // SVG parameters
  const paddingX = 30;
  const paddingY = 15;
  const width = 340;
  const height = 90;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Map coordinate to SVG position
  const getSvgX = (dist) => {
    return paddingX + (dist / totalDist) * chartWidth;
  };

  const getSvgY = (elev) => {
    return paddingY + chartHeight - ((elev - yMin) / ySpan) * chartHeight;
  };

  // Construct SVG Path points
  const points = profile.map((p) => {
    const x = getSvgX(p.distance);
    const y = getSvgY(p.elevation);
    return `${x},${y}`;
  });

  // Area path starts at (paddingX, chartHeight + paddingY), goes through points, ends at (chartWidth + paddingX, chartHeight + paddingY)
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${getSvgX(totalDist)},${chartHeight + paddingY} L ${getSvgX(0)},${chartHeight + paddingY} Z`;

  // Handle hover interactions
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Scale mouseX to chart space
    const relativeX = mouseX - (paddingX * (rect.width / width));
    const percentX = relativeX / (chartWidth * (rect.width / width));
    const targetDist = percentX * totalDist;

    // Find the closest point in profile
    let closest = profile[0];
    let minDiff = Math.abs(closest.distance - targetDist);

    for (let i = 1; i < profile.length; i++) {
      const diff = Math.abs(profile[i].distance - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        closest = profile[i];
      }
    }

    if (closest) {
      const x = getSvgX(closest.distance);
      const y = getSvgY(closest.elevation);
      
      setHoveredPoint(closest);
      setTooltip({
        x: (x / width) * 100, // percentage for responsive placement
        y: (y / height) * 100,
        elevation: closest.elevation,
        distance: closest.distance,
        slope: closest.slope
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setTooltip(null);
  };

  // Color helper based on slope
  const getSlopeColorClass = (slope) => {
    const absSlope = Math.abs(slope);
    if (absSlope > 12) return 'var(--accent-rose)';
    if (absSlope > 8) return 'var(--accent-amber)';
    return 'var(--accent-cyan)';
  };

  return (
    <div className="elevation-profile-container">
      <div className="elevation-profile-header">
        <span className="elevation-profile-title">Perfil de Altitud</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Subida: <strong>{route.elevationGain}m</strong> | Bajada: <strong>{route.elevationLoss}m</strong>
        </span>
      </div>

      <div
        className="elevation-chart-wrapper"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="elevation-chart-svg"
          ref={svgRef}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line
            x1={paddingX}
            y1={getSvgY(yMin)}
            x2={width - paddingX}
            y2={getSvgY(yMin)}
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <line
            x1={paddingX}
            y1={getSvgY(yMax)}
            x2={width - paddingX}
            y2={getSvgY(yMax)}
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Axis Labels */}
          <text
            x={paddingX - 5}
            y={getSvgY(yMin) + 3}
            fill="var(--text-muted)"
            fontSize="7.5"
            textAnchor="end"
          >
            {Math.round(yMin)}m
          </text>
          <text
            x={paddingX - 5}
            y={getSvgY(yMax) + 3}
            fill="var(--text-muted)"
            fontSize="7.5"
            textAnchor="end"
          >
            {Math.round(yMax)}m
          </text>
          <text
            x={paddingX}
            y={height - 2}
            fill="var(--text-muted)"
            fontSize="7.5"
            textAnchor="start"
          >
            0m
          </text>
          <text
            x={width - paddingX}
            y={height - 2}
            fill="var(--text-muted)"
            fontSize="7.5"
            textAnchor="end"
          >
            {totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)}km` : `${totalDist}m`}
          </text>

          {/* Filled Area */}
          <path d={areaPath} fill="url(#chartGradient)" />

          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Hover indicator dot */}
          {tooltip && (
            <>
              <line
                x1={getSvgX(tooltip.distance)}
                y1={paddingY}
                x2={getSvgX(tooltip.distance)}
                y2={chartHeight + paddingY}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <circle
                cx={getSvgX(tooltip.distance)}
                cy={getSvgY(tooltip.elevation)}
                r="4.5"
                fill="#ffffff"
                stroke="var(--accent-cyan)"
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 0 5px rgba(0, 242, 254, 0.8))' }}
              />
            </>
          )}
        </svg>

        {/* Floating details tooltip on hover */}
        {tooltip && (
          <div
            className="chart-tooltip"
            style={{
              position: 'absolute',
              left: `${Math.min(75, Math.max(5, tooltip.x - 15))}%`,
              bottom: '15px'
            }}
          >
            <div>Dist: <strong>{tooltip.distance} m</strong></div>
            <div>Elev: <strong>{tooltip.elevation} m</strong></div>
            <div style={{ color: getSlopeColorClass(tooltip.slope) }}>
              Inclin: <strong>{tooltip.slope}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
