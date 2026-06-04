// Mock routing and elevation data for demonstration.
// Highly detailed paths in famous hilly cities (San Francisco & Valparaíso).

export const DEMO_CITIES = {
  sf: {
    name: "San Francisco (Lombard St a Coit Tower)",
    center: [37.8021, -122.4136],
    origin: { name: "Lombard St & Hyde St", coords: [37.8022, -122.4191] },
    destination: { name: "Coit Tower", coords: [37.8024, -122.4058] },
    routes: [
      {
        id: "sf-flat",
        name: "Ruta Flana (Recomendada FlatSteps)",
        type: "flat",
        badge: "Recomendada (Plana)",
        badgeType: "success",
        distance: 1450, // 1.45 km
        duration: 18, // 18 mins (slope-adjusted: 18 mins)
        elevationGain: 22, // 22m total climb
        elevationLoss: 24,
        maxSlope: 5.8, // 5.8% max slope
        repechosCount: 0, // No climbs over 8%
        // Array of [lat, lng, elevation]
        coordinates: [
          [37.8022, -122.4191, 85],
          [37.8012, -122.4190, 83],
          [37.8013, -122.4150, 78],
          [37.8000, -122.4148, 79],
          [37.7998, -122.4100, 75],
          [37.8008, -122.4095, 78],
          [37.8010, -122.4070, 82],
          [37.8024, -122.4058, 83]
        ],
        elevationProfile: [
          { distance: 0, elevation: 85, slope: 0 },
          { distance: 200, elevation: 83, slope: -1.0 },
          { distance: 550, elevation: 78, slope: -1.4 },
          { distance: 700, elevation: 79, slope: 0.7 },
          { distance: 1100, elevation: 75, slope: -1.0 },
          { distance: 1200, elevation: 78, slope: 3.0 },
          { distance: 1350, elevation: 82, slope: 2.7 },
          { distance: 1450, elevation: 83, slope: 1.0 }
        ]
      },
      {
        id: "sf-shortest",
        name: "Ruta Directa por Filbert St (Muy Empinada)",
        type: "steep",
        badge: "La más corta (Agresiva)",
        badgeType: "danger",
        distance: 1180, // 1.18 km
        duration: 25, // adjusted for slope (base 14m + 11m penalty for 110m climbing!)
        elevationGain: 112,
        elevationLoss: 114,
        maxSlope: 26.5, // 26.5% incline (Filbert St is famous for this)
        repechosCount: 2,
        coordinates: [
          [37.8022, -122.4191, 85],
          [37.8021, -122.4172, 60],
          [37.8020, -122.4140, 25],
          [37.8019, -122.4110, 52],
          [37.8018, -122.4082, 98],
          [37.8024, -122.4058, 83]
        ],
        elevationProfile: [
          { distance: 0, elevation: 85, slope: 0 },
          { distance: 180, elevation: 60, slope: -13.8 },
          { distance: 450, elevation: 25, slope: -12.9 },
          { distance: 720, elevation: 52, slope: 10.0 }, // Repecho 1
          { distance: 980, elevation: 98, slope: 17.6 }, // Repecho 2 (Steepest)
          { distance: 1180, elevation: 83, slope: -7.5 }
        ]
      },
      {
        id: "sf-balanced",
        name: "Ruta Histórica de Lombard St (Intermedia)",
        type: "balanced",
        badge: "Modo Turista",
        badgeType: "warning",
        distance: 1310,
        duration: 20, // base 16m + 4m penalty for 42m climb
        elevationGain: 42,
        elevationLoss: 44,
        maxSlope: 11.2, // 11.2% max slope
        repechosCount: 1,
        coordinates: [
          [37.8022, -122.4191, 85],
          [37.8021, -122.4150, 75],
          [37.8015, -122.4120, 68],
          [37.8016, -122.4080, 89],
          [37.8024, -122.4058, 83]
        ],
        elevationProfile: [
          { distance: 0, elevation: 85, slope: 0 },
          { distance: 360, elevation: 75, slope: -2.7 },
          { distance: 680, elevation: 68, slope: -2.1 },
          { distance: 1080, elevation: 89, slope: 5.2 }, // Moderado
          { distance: 1310, elevation: 83, slope: -2.6 }
        ]
      }
    ]
  },
  valpo: {
    name: "Valparaíso (Cerro Alegre a Plaza Sotomayor)",
    center: [-33.0418, -71.6288],
    origin: { name: "Paseo Yugoslavo (Cerro Alegre)", coords: [-33.0415, -71.6292] },
    destination: { name: "Plaza Sotomayor", coords: [-33.0384, -71.6285] },
    routes: [
      {
        id: "valpo-flat",
        name: "Camino por Calles Serpentinas (Sin escaleras)",
        type: "flat",
        badge: "Recomendada (Plana)",
        badgeType: "success",
        distance: 650,
        duration: 8, // slope-adjusted
        elevationGain: 5,
        elevationLoss: 55,
        maxSlope: 6.2,
        repechosCount: 0,
        coordinates: [
          [-33.0415, -71.6292, 50],
          [-33.0409, -71.6298, 48],
          [-33.0400, -71.6300, 35],
          [-33.0390, -71.6292, 12],
          [-33.0384, -71.6285, 2]
        ],
        elevationProfile: [
          { distance: 0, elevation: 50, slope: 0 },
          { distance: 120, elevation: 48, slope: -1.6 },
          { distance: 250, elevation: 35, slope: -10.0 }, // Cuesta abajo
          { distance: 480, elevation: 12, slope: -10.0 }, // Cuesta abajo
          { distance: 650, elevation: 2, slope: -5.8 }
        ]
      },
      {
        id: "valpo-steep",
        name: "Bajada por Escalinata Apolo (Pendiente Severa)",
        type: "steep",
        badge: "Directo por Escalera",
        badgeType: "danger",
        distance: 360,
        duration: 6, // base 4m + slope penalty (very steep staircase)
        elevationGain: 2,
        elevationLoss: 50,
        maxSlope: 32.4, // Extremely steep stairs
        repechosCount: 1, // Steep going up, or severe down
        coordinates: [
          [-33.0415, -71.6292, 50],
          [-33.0400, -71.6288, 15],
          [-33.0384, -71.6285, 2]
        ],
        elevationProfile: [
          { distance: 0, elevation: 50, slope: 0 },
          { distance: 180, elevation: 15, slope: -19.4 },
          { distance: 360, elevation: 2, slope: -7.2 }
        ]
      }
    ]
  }
};
