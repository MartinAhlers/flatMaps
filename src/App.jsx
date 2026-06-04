import React, { useState, useEffect } from 'react';
import './styles/App.css';
import SearchPanel from './components/SearchPanel';
import RouteCard from './components/RouteCard';
import ElevationProfile from './components/ElevationProfile';
import SettingsPanel from './components/SettingsPanel';
import Map from './components/Map';
import { getRoutesKeyless, getRoutesWithORS } from './services/routing';


export default function App() {
  // Persistence state
  const [orsKey, setOrsKey] = useState(() => localStorage.getItem('flatsteps_ors_key') || '');
  const [slopeThreshold, setSlopeThreshold] = useState(() => {
    const saved = localStorage.getItem('flatsteps_slope_threshold');
    return saved ? parseInt(saved) : 8;
  });

  // Map state
  const [mapCenter, setMapCenter] = useState([-34.9011, -56.1674]); // Default Montevideo center
  const [mapZoom, setMapZoom] = useState(13);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  // Geolocalizar en el montaje inicial para centrar en la ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(14.5);
          // Establecer la ubicación del usuario como origen por defecto
          setOrigin({
            name: "Mi ubicación actual",
            lat: latitude,
            lon: longitude
          });
        },
        (error) => {
          console.log("Acceso a geolocalización denegado o fallido. Usando Montevideo como default.");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // App routing data states
  const [routes, setRoutes] = useState([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);



  // Save configurations
  useEffect(() => {
    localStorage.setItem('flatsteps_ors_key', orsKey);
  }, [orsKey]);

  useEffect(() => {
    localStorage.setItem('flatsteps_slope_threshold', slopeThreshold.toString());
  }, [slopeThreshold]);



  // Run Route Search (can accept resolved origin/dest directly from SearchPanel)
  const handleSearchRoutes = async (customOrigin = null, customDest = null) => {
    const activeOrigin = customOrigin || origin;
    const activeDest = customDest || destination;

    if (!activeOrigin || !activeDest) return;
    setIsLoading(true);
    setErrorMsg('');
    setHoveredPoint(null);

    // Sync state in parent if resolved on-the-fly from text input
    if (customOrigin) setOrigin(customOrigin);
    if (customDest) setDestination(customDest);

    try {
      let results = [];
      if (orsKey && orsKey.trim() !== '') {
        results = await getRoutesWithORS(activeOrigin, activeDest, orsKey, slopeThreshold);
      } else {
        results = await getRoutesKeyless(activeOrigin, activeDest, slopeThreshold);
      }
      
      setRoutes(results);
      setActiveRouteIndex(0);
      
      // Center map around route mid point
      if (results.length > 0 && results[0].coordinates.length > 0) {
        const midIdx = Math.floor(results[0].coordinates.length / 2);
        const midPoint = results[0].coordinates[midIdx];
        setMapCenter([midPoint[0], midPoint[1]]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al obtener las rutas. Por favor, intenta de nuevo.');
      
      // Clear routing states if search fails
      setRoutes([]);
      setActiveRouteIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setOrigin(null);
    setDestination(null);
    setRoutes([]);
    setActiveRouteIndex(0);
    setHoveredPoint(null);
    setErrorMsg('');
  };

  return (
    <div className="app-container">
      {/* Sidebar Dashboard */}
      <aside className="sidebar">
        {/* Header Title */}
        <header className="app-header">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="app-title">FlatSteps</h1>
            <div className="app-subtitle">Rutas peatonales inteligentes sin pendientes</div>
          </div>
        </header>

        {/* Route Search Inputs */}
        <SearchPanel
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          onSearch={handleSearchRoutes}
          isLoading={isLoading}
          onClear={handleClear}
          mapCenter={mapCenter}
        />



        {/* Results Info and Options List */}
        <div className="dashboard-section" style={{ flexGrow: 1, borderBottom: 'none' }}>
          <h3>
            <span>Caminos Encontrados</span>
            {routes.length > 0 && <span className="badge badge-success">{routes.length} opciones</span>}
          </h3>

          {isLoading ? (
            <div className="loading-spinner-wrapper">
              <div className="spinner"></div>
              <span>Analizando el relieve terrestre...</span>
            </div>
          ) : routes.length > 0 ? (
            <div className="routes-list">
              {routes.map((route, idx) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  selected={idx === activeRouteIndex}
                  onClick={() => {
                    setActiveRouteIndex(idx);
                    setHoveredPoint(null);
                  }}
                />
              ))}

              {/* Display Elevation Profile Chart of Selected Route */}
              <ElevationProfile
                route={routes[activeRouteIndex]}
                hoveredPoint={hoveredPoint}
                setHoveredPoint={setHoveredPoint}
              />

              {routes[activeRouteIndex]?.elevationMuted && (
                <div className="info-banner" style={{ borderLeft: '3px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)', color: '#d1d5db', marginTop: '10px' }}>
                  ⚠️ <strong>Relieve no disponible:</strong> No se pudo conectar al servicio de elevación (Open-Meteo). Las pendientes se calculan como planas.
                </div>
              )}
            </div>
          ) : (
            <div className="blank-state">
              <div className="blank-state-icon">
                <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="blank-state-title">¿Listo para caminar?</div>
              <div className="blank-state-desc">
                Busca una ruta usando el panel de arriba, toca el mapa para marcar dos puntos, o selecciona un tour de prueba rápido.
              </div>
              {!orsKey && (
                <div className="info-banner">
                  💡 <strong>Tip:</strong> Puedes hacer click en el mapa en cualquier parte para definir origen y destino interactivamente.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Map Viewport */}
      <main className="map-container">
        {/* Floating Settings Button */}
        <button
          className="settings-toggle-btn"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title="Ajustes de navegación"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Floating Settings Menu Modal */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          orsKey={orsKey}
          setOrsKey={setOrsKey}
          slopeThreshold={slopeThreshold}
          setSlopeThreshold={setSlopeThreshold}
        />

        {/* Error Toast Alert */}
        {errorMsg && (
          <div className="toast-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* The Map Component */}
        <Map
          center={mapCenter}
          zoom={mapZoom}
          origin={origin}
          destination={destination}
          setOrigin={setOrigin}
          setDestination={setDestination}
          routes={routes}
          activeRouteIndex={activeRouteIndex}
          setActiveRouteIndex={setActiveRouteIndex}
          hoveredPoint={hoveredPoint}
        />
      </main>
    </div>
  );
}
