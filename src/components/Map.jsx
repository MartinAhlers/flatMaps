import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom icons using inline SVGs to avoid Vite asset resolution issues and matches theme
const originIcon = L.divIcon({
  className: 'custom-marker-origin',
  html: `<div style="
    width: 18px;
    height: 18px;
    background-color: #10b981;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 10px #10b981;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const destIcon = L.divIcon({
  className: 'custom-marker-dest',
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="#f43f5e" stroke="#ffffff" stroke-width="2" style="filter: drop-shadow(0 0 4px rgba(244, 63, 94, 0.6));">
    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
    <circle cx="12" cy="10" r="3" fill="#0d0f12"/>
  </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const hoverIcon = L.divIcon({
  className: 'custom-marker-hover',
  html: `<div style="
    width: 14px;
    height: 14px;
    background-color: #ffffff;
    border: 3.5px solid #00f2fe;
    border-radius: 50%;
    box-shadow: 0 0 12px #00f2fe;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Helper component to center map view
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 15);
    }
  }, [center, zoom, map]);
  return null;
}

// Helper component to fit map boundaries to route coords
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(c => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [coords, map]);
  return null;
}

export default function Map({
  center,
  zoom,
  origin,
  destination,
  setOrigin,
  setDestination,
  routes,
  activeRouteIndex,
  setActiveRouteIndex,
  hoveredPoint
}) {
  const activeRoute = routes[activeRouteIndex];

  // Map clicks to set markers if routing hasn't run yet or we want to update
  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;
        // If origin is not set, set it first
        if (!origin) {
          setOrigin({
            name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lon: lng
          });
        } else if (!destination) {
          setDestination({
            name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lon: lng
          });
        } else {
          // Both set, clear and reset origin
          setOrigin({
            name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lon: lng
          });
          setDestination(null);
        }
      };
      map.on('click', handleMapClick);
      return () => map.off('click', handleMapClick);
    }, [map]);

    return null;
  };

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false} // position custom zoom control later or hide
      >
        <ChangeView center={center} zoom={zoom} />
        {activeRoute && <FitBounds coords={activeRoute.coordinates} />}
        <MapEvents />

        {/* CartoDB Dark Matter tile layer matches premium dark mode */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Render alternative inactive routes first (so they sit below active route) */}
        {routes.map((route, idx) => {
          if (idx === activeRouteIndex) return null;
          return (
            <Polyline
              key={route.id}
              positions={route.coordinates.map(c => [c[0], c[1]])}
              pathOptions={{
                color: '#475569', // Muted slate gray for inactive routes
                weight: 4,
                opacity: 0.5,
                dashArray: '5,5'
              }}
              eventHandlers={{
                click: () => setActiveRouteIndex(idx)
              }}
            />
          );
        })}

        {/* Render active route on top */}
        {activeRoute && (
          <Polyline
            positions={activeRoute.coordinates.map(c => [c[0], c[1]])}
            pathOptions={{
              color: activeRoute.type === 'flat' ? '#10b981' : '#00f2fe', // Glowing emerald for flat, cyan for steep/other
              weight: 6,
              opacity: 0.95
            }}
          />
        )}

        {/* Origin Marker */}
        {origin && (
          <Marker
            position={[origin.lat, origin.lon]}
            icon={originIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                setOrigin({
                  name: `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`,
                  lat: position.lat,
                  lon: position.lng
                });
              }
            }}
          >
            <Popup>
              <div className="map-popup-title">Partida (Origen)</div>
              <div className="map-popup-text">{origin.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lon]}
            icon={destIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                setDestination({
                  name: `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`,
                  lat: position.lat,
                  lon: position.lng
                });
              }
            }}
          >
            <Popup>
              <div className="map-popup-title">Destino</div>
              <div className="map-popup-text">{destination.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Glowing point reflecting hover on elevation profile */}
        {hoveredPoint && (
          <Marker
            position={[hoveredPoint.lat, hoveredPoint.lng]}
            icon={hoverIcon}
            zIndexOffset={1000}
          >
            <Popup closeButton={false}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                Progreso: {hoveredPoint.distance}m<br />
                Altitud: {hoveredPoint.elevation}m<br />
                Pendiente: {hoveredPoint.slope}%
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
