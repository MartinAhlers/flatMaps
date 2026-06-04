// Service for handling geocoding, routing, and elevation calculation.

const OSRM_FOOT_ENDPOINT = "https://routing.openstreetmap.de/routed-foot/route/v1/walking";
const OPEN_METEO_ELEVATION_ENDPOINT = "https://elevation-api.open-meteo.com/v1/elevation";
const NOMINATIM_SEARCH_ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Helper: Haversine distance between two coordinates in meters
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// Helper: Address search using OpenStreetMap Nominatim with mapCenter bias
export async function searchLocation(query, mapCenter = null) {
  if (!query || query.trim().length < 3) return [];
  try {
    let url = `${NOMINATIM_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
    if (mapCenter && mapCenter.length === 2) {
      const [lat, lon] = mapCenter;
      const left = lon - 0.4;
      const right = lon + 0.4;
      const top = lat + 0.4;
      const bottom = lat - 0.4;
      url += `&viewbox=${left},${top},${right},${bottom}`;
    }
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "es,en",
        "User-Agent": "FlatSteps-Slope-Aware-Walking-PWA"
      }
    });
    if (!response.ok) throw new Error("Search failed");
    const data = await response.json();
    return data.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

// Calculate slope metrics for a list of coordinates with elevations
// coordsWithElev: Array of [lat, lng, elevation]
export function processElevationProfile(coordsWithElev, slopeThreshold = 8) {
  let distanceAccum = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxSlope = 0;
  let repechosCount = 0;
  let isCurrentlyInRepecho = false;
  let repechoDistanceAccum = 0;

  const elevationProfile = [];

  // Seed the first point
  if (coordsWithElev.length > 0) {
    elevationProfile.push({
      distance: 0,
      elevation: coordsWithElev[0][2] || 0,
      slope: 0,
      lat: coordsWithElev[0][0],
      lng: coordsWithElev[0][1]
    });
  }

  for (let i = 1; i < coordsWithElev.length; i++) {
    const [lat1, lng1, h1] = coordsWithElev[i - 1];
    const [lat2, lng2, h2] = coordsWithElev[i];

    const dist = getDistance(lat1, lng1, lat2, lng2);
    distanceAccum += dist;

    const heightDiff = h2 - h1;
    if (heightDiff > 0) {
      elevationGain += heightDiff;
    } else {
      elevationLoss += Math.abs(heightDiff);
    }

    // Slope percentage (rise / run * 100)
    // Avoid division by zero
    const slope = dist > 0.5 ? (heightDiff / dist) * 100 : 0;
    
    if (Math.abs(slope) > Math.abs(maxSlope)) {
      maxSlope = slope;
    }

    // Detect steep climbs ("repechos")
    // A repecho is defined as an incline greater than threshold (e.g. > 8%)
    // that persists for more than a brief step (we track consecutive segments).
    if (slope >= slopeThreshold) {
      if (!isCurrentlyInRepecho) {
        isCurrentlyInRepecho = true;
        repechoDistanceAccum = 0;
      }
      repechoDistanceAccum += dist;
    } else {
      if (isCurrentlyInRepecho) {
        // If the climb was longer than 15 meters, count it as a "repecho"
        if (repechoDistanceAccum > 15) {
          repechosCount++;
        }
        isCurrentlyInRepecho = false;
      }
    }

    elevationProfile.push({
      distance: Math.round(distanceAccum),
      elevation: Math.round(h2),
      slope: parseFloat(slope.toFixed(1)),
      lat: lat2,
      lng: lng2
    });
  }

  // If route ends while in a steep climb
  if (isCurrentlyInRepecho && repechoDistanceAccum > 15) {
    repechosCount++;
  }

  return {
    elevationProfile,
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    maxSlope: parseFloat(Math.abs(maxSlope).toFixed(1)),
    repechosCount,
    totalDistance: Math.round(distanceAccum)
  };
}

// Downsample coordinates list to prevent hitting URL limits or API abuse
function downsampleCoordinates(coords, maxPoints = 40) {
  if (coords.length <= maxPoints) return coords;
  const step = (coords.length - 1) / (maxPoints - 1);
  const sampled = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    sampled.push(coords[Math.round(i * step)]);
  }
  sampled.push(coords[coords.length - 1]); // always include the destination
  return sampled;
}

// Fetch elevation data for an array of coordinates [[lat, lng], ...] from Open-Meteo
// Helper: Fetch elevation using Open-Elevation POST API as fallback
async function fetchOpenElevation(sampledCoordinates) {
  const url = "https://api.open-elevation.com/api/v1/lookup";
  const body = {
    locations: sampledCoordinates.map(c => ({ latitude: c[0], longitude: c[1] }))
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error("Open-Elevation API failed");
  const data = await response.json();
  return sampledCoordinates.map((coord, idx) => [
    coord[0],
    coord[1],
    data.results[idx].elevation
  ]);
}

// Fetch elevation data for an array of coordinates [[lat, lng], ...] from Open-Meteo
// Falls back to Open-Elevation if Open-Meteo fails, and then to flat terrain.
export async function fetchElevationForCoordinates(coordinates) {
  // Downsample to maximum 50 points to stay within safe HTTP GET limits
  const sampled = downsampleCoordinates(coordinates, 45);

  // Intento 1: Open-Meteo
  try {
    const lats = sampled.map(c => c[0]).join(",");
    const lons = sampled.map(c => c[1]).join(",");
    const url = `${OPEN_METEO_ELEVATION_ENDPOINT}?latitude=${lats}&longitude=${lons}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch from Open-Meteo");
    
    const data = await response.json();
    return sampled.map((coord, idx) => [
      coord[0],
      coord[1],
      data.elevation[idx]
    ]);
  } catch (errorMeteo) {
    console.warn("Open-Meteo falló o está bloqueado, intentando Open-Elevation...", errorMeteo);
    
    // Intento 2: Open-Elevation
    try {
      return await fetchOpenElevation(sampled);
    } catch (errorElevation) {
      console.warn("Open-Elevation también falló. El relieve será plano:", errorElevation);
      // Fallback Final: Relieve plano (0m)
      const fallbackCoords = sampled.map((coord) => [coord[0], coord[1], 0]);
      fallbackCoords.isSimulated = true;
      return fallbackCoords;
    }
  }
}

// Main function: Fetch routes using OSRM, then enrich them with Open-Meteo elevation data
export async function getRoutesKeyless(origin, destination, slopeThreshold = 8) {
  // Coordinates are ordered [lng, lat] for OSRM URL
  const coordsString = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const url = `${OSRM_FOOT_ENDPOINT}/${coordsString}?overview=full&geometries=geojson&alternatives=true`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo obtener la ruta. Por favor intenta de nuevo.");
  
  const data = await response.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error("No se encontraron caminos para ir caminando entre estos puntos.");
  }

  const processedRoutes = [];

  for (let idx = 0; idx < data.routes.length; idx++) {
    const route = data.routes[idx];
    // geometries is GeoJSON LineString (array of [lon, lat])
    // Convert to [lat, lon]
    const routeCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);
    
    // Fetch elevations
    const coordsWithElev = await fetchElevationForCoordinates(routeCoords);
    
    // Process slope and climbing
    const elevationMetrics = processElevationProfile(coordsWithElev, slopeThreshold);
    
    // Naismith's Rule walking time correction:
    // Base speed: 5 km/h (1.39 m/s) -> time = distance / 1.39 seconds
    // Ascent penalty: add 10 minutes (600 seconds) for every 100 meters climbed (or 6 seconds per meter)
    const baseDurationSec = route.distance / 1.389; // 5 km/h
    const climbPenaltySec = elevationMetrics.elevationGain * 6; // 10 mins per 100m climb
    const totalDurationMin = Math.max(1, Math.round((baseDurationSec + climbPenaltySec) / 60));

    processedRoutes.push({
      id: `route-keyless-${idx}`,
      name: idx === 0 ? "Ruta Recomendada" : `Ruta Alternativa ${idx}`,
      type: idx === 0 ? "flat" : "alternative",
      badge: "",
      badgeType: "secondary",
      distance: Math.round(route.distance),
      duration: totalDurationMin,
      elevationGain: elevationMetrics.elevationGain,
      elevationLoss: elevationMetrics.elevationLoss,
      maxSlope: elevationMetrics.maxSlope,
      repechosCount: elevationMetrics.repechosCount,
      coordinates: coordsWithElev,
      elevationProfile: elevationMetrics.elevationProfile,
      elevationMuted: coordsWithElev.isSimulated || false
    });
  }

  // Sort/tag routes to identify the flattest vs fastest
  // Recommendation logic:
  // We want to highlight the route with the lowest maximum slope or lowest elevation gain
  // as the "FlatSteps Choice" (Recomendada Plana).
  
  // Sort copies to find flatest
  const sortedBySlope = [...processedRoutes].sort((a, b) => a.maxSlope - b.maxSlope);
  const sortedByDistance = [...processedRoutes].sort((a, b) => a.distance - b.distance);

  processedRoutes.forEach(r => {
    if (r.id === sortedBySlope[0].id) {
      r.badge = "Recomendada (Plana)";
      r.badgeType = "success";
      r.type = "flat";
    } else if (r.id === sortedByDistance[0].id) {
      r.badge = "La más corta";
      r.badgeType = "danger";
      r.type = "steep";
    } else {
      r.badge = "Ruta Alternativa";
      r.badgeType = "warning";
      r.type = "balanced";
    }
  });

  // Re-sort processedRoutes so that the Recommended (Flat) route is always FIRST
  return processedRoutes.sort((a, b) => {
    if (a.type === "flat") return -1;
    if (b.type === "flat") return 1;
    return 0;
  });
}

// Fetch routes using Openrouteservice (ORS) API if the user provides a key
export async function getRoutesWithORS(origin, destination, apiKey, slopeThreshold = 8) {
  const url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
  
  const body = {
    coordinates: [
      [origin.lon, origin.lat],
      [destination.lon, destination.lat]
    ],
    elevation: true,
    alternative_routes: {
      share_factor: 0.6,
      target_count: 3
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || "Error al conectar con Openrouteservice. Verifica tu API Key.");
  }

  const data = await response.json();
  if (!data.features || data.features.length === 0) {
    throw new Error("No se encontraron caminos con elevación para estos puntos.");
  }

  const processedRoutes = data.features.map((feature, idx) => {
    // coordinates in ORS GeoJSON are [[lon, lat, elev], ...]
    // Convert to [[lat, lon, elev]]
    const coordsWithElev = feature.geometry.coordinates.map(c => [c[1], c[0], c[2] || 0]);
    const properties = feature.properties;
    
    const elevationMetrics = processElevationProfile(coordsWithElev, slopeThreshold);
    
    // Naismith walking speed correction
    const distance = properties.summary.distance; // in meters
    const baseDurationSec = distance / 1.389; // 5 km/h
    const climbPenaltySec = elevationMetrics.elevationGain * 6; // 10 min/100m
    const totalDurationMin = Math.max(1, Math.round((baseDurationSec + climbPenaltySec) / 60));

    return {
      id: `route-ors-${idx}`,
      name: idx === 0 ? "Ruta ORS Directa" : `Ruta ORS Alternativa ${idx}`,
      type: idx === 0 ? "flat" : "alternative",
      badge: "",
      badgeType: "secondary",
      distance: Math.round(distance),
      duration: totalDurationMin,
      elevationGain: elevationMetrics.elevationGain,
      elevationLoss: elevationMetrics.elevationLoss,
      maxSlope: elevationMetrics.maxSlope,
      repechosCount: elevationMetrics.repechosCount,
      coordinates: coordsWithElev,
      elevationProfile: elevationMetrics.elevationProfile
    };
  });

  // Sort & tag routes
  const sortedBySlope = [...processedRoutes].sort((a, b) => a.maxSlope - b.maxSlope);
  const sortedByDistance = [...processedRoutes].sort((a, b) => a.distance - b.distance);

  processedRoutes.forEach(r => {
    if (r.id === sortedBySlope[0].id) {
      r.badge = "Recomendada (Plana)";
      r.badgeType = "success";
      r.type = "flat";
    } else if (r.id === sortedByDistance[0].id) {
      r.badge = "La más corta";
      r.badgeType = "danger";
      r.type = "steep";
    } else {
      r.badge = "Ruta Alternativa";
      r.badgeType = "warning";
      r.type = "balanced";
    }
  });

  return processedRoutes.sort((a, b) => {
    if (a.type === "flat") return -1;
    if (b.type === "flat") return 1;
    return 0;
  });
}
