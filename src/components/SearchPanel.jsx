import React, { useState, useEffect, useRef } from 'react';
import { searchLocation } from '../services/routing';

export default function SearchPanel({
  origin,
  setOrigin,
  destination,
  setDestination,
  onSearch,
  isLoading,
  onClear,
  mapCenter
}) {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isResolvingGeocode, setIsResolvingGeocode] = useState(false);

  const originRef = useRef();
  const destRef = useRef();

  // Sync inputs with state if changed elsewhere (like dragging markers)
  useEffect(() => {
    if (origin) {
      setOriginQuery(origin.name || `${origin.lat.toFixed(5)}, ${origin.lon.toFixed(5)}`);
    } else {
      setOriginQuery('');
    }
  }, [origin]);

  useEffect(() => {
    if (destination) {
      setDestQuery(destination.name || `${destination.lat.toFixed(5)}, ${destination.lon.toFixed(5)}`);
    } else {
      setDestQuery('');
    }
  }, [destination]);

  // Handle outside clicks to close suggestion popups
  useEffect(() => {
    function handleClickOutside(event) {
      if (originRef.current && !originRef.current.contains(event.target)) {
        setShowOriginSuggestions(false);
      }
      if (destRef.current && !destRef.current.contains(event.target)) {
        setShowDestSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions for Origin biased by current map center
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (originQuery && originQuery.length > 3 && originQuery !== origin?.name) {
        const results = await searchLocation(originQuery, mapCenter);
        setOriginSuggestions(results);
        setShowOriginSuggestions(results.length > 0);
      } else {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [originQuery, origin, mapCenter]);

  // Fetch suggestions for Destination biased by current map center
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (destQuery && destQuery.length > 3 && destQuery !== destination?.name) {
        const results = await searchLocation(destQuery, mapCenter);
        setDestSuggestions(results);
        setShowDestSuggestions(results.length > 0);
      } else {
        setDestSuggestions([]);
        setShowDestSuggestions(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [destQuery, destination, mapCenter]);

  // Geolocation button
  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada por tu navegador.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const myCoords = {
          name: "Mi ubicación actual",
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setOrigin(myCoords);
        setOriginQuery("Mi ubicación actual");
        setLocating(false);
      },
      (error) => {
        console.error(error);
        alert("No se pudo obtener tu ubicación actual.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Trigger search, geocoding written text on-the-fly if not previously selected
  const handleTrazarRutas = async () => {
    let finalOrigin = origin;
    let finalDestination = destination;

    setIsResolvingGeocode(true);

    // Resolve Origin text if it doesn't match selected origin object
    if (originQuery.trim() && (!finalOrigin || finalOrigin.name !== originQuery)) {
      const results = await searchLocation(originQuery, mapCenter);
      if (results.length > 0) {
        finalOrigin = results[0];
        setOrigin(finalOrigin);
      } else {
        alert(`No se pudo encontrar la dirección de origen: "${originQuery}"`);
        setIsResolvingGeocode(false);
        return;
      }
    }

    // Resolve Destination text if it doesn't match selected destination object
    if (destQuery.trim() && (!finalDestination || finalDestination.name !== destQuery)) {
      const results = await searchLocation(destQuery, mapCenter);
      if (results.length > 0) {
        finalDestination = results[0];
        setDestination(finalDestination);
      } else {
        alert(`No se pudo encontrar la dirección de destino: "${destQuery}"`);
        setIsResolvingGeocode(false);
        return;
      }
    }

    setIsResolvingGeocode(false);

    if (finalOrigin && finalDestination) {
      onSearch(finalOrigin, finalDestination);
    }
  };

  // Keyboard Enter support for submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
      setShowOriginSuggestions(false);
      setShowDestSuggestions(false);
      handleTrazarRutas();
    }
  };

  return (
    <div className="dashboard-section">
      <div className="form-group" ref={originRef}>
        <label>Origen (Punto de Partida)</label>
        <div className="input-with-icon">
          <span className="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="#10b981" />
            </svg>
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar o escribir dirección..."
            value={originQuery}
            onChange={(e) => setOriginQuery(e.target.value)}
            onFocus={() => originSuggestions.length > 0 && setShowOriginSuggestions(true)}
            onKeyDown={handleKeyDown}
          />
          {showOriginSuggestions && (
            <ul className="suggestions-list">
              {originSuggestions.map((s, idx) => (
                <li
                  key={idx}
                  className="suggestion-item"
                  onClick={() => {
                    setOrigin(s);
                    setOriginQuery(s.name);
                    setShowOriginSuggestions(false);
                  }}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="form-group" ref={destRef}>
        <label>Destino (¿Adónde vas?)</label>
        <div className="input-with-icon">
          <span className="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" fill="#f43f5e" />
            </svg>
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar o escribir dirección..."
            value={destQuery}
            onChange={(e) => setDestQuery(e.target.value)}
            onFocus={() => destSuggestions.length > 0 && setShowDestSuggestions(true)}
            onKeyDown={handleKeyDown}
          />
          {showDestSuggestions && (
            <ul className="suggestions-list">
              {destSuggestions.map((s, idx) => (
                <li
                  key={idx}
                  className="suggestion-item"
                  onClick={() => {
                    setDestination(s);
                    setDestQuery(s.name);
                    setShowDestSuggestions(false);
                  }}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={handleTrazarRutas}
        disabled={isLoading || isResolvingGeocode || !originQuery.trim() || !destQuery.trim()}
      >
        {isLoading || isResolvingGeocode ? (
          <>
            <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#0d0f12', borderLeftColor: '#0d0f12' }}></span>
            {isResolvingGeocode ? "Buscando direcciones..." : "Calculando caminos..."}
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Trazar Rutas
          </>
        )}
      </button>

      <div className="secondary-controls">
        <button className="btn-secondary" onClick={handleGPS} disabled={locating}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
          {locating ? "Ubicando..." : "Mi Ubicación"}
        </button>
        <button className="btn-secondary" onClick={onClear}>
          Limpiar
        </button>
      </div>
    </div>
  );
}
