// ============================================================
//  QGIS Plugin Hub — Taxonomy Configuration
//  Hierarchical: REALMS > CATEGORIES > tags
// ============================================================

/**
 * Top-level grouping of categories into "Realms" (parent areas).
 * Each realm contains an icon, accent color, and list of child category keys.
 */
const TAXONOMY_REALMS = {
  "Geospatial Processing": {
    icon: "🧮", color: "#7fb99b", // Sage-Emerald: Organic, Precise
    description: "Core spatial operations, raster/vector analysis, 3D and geoprocessing workflows",
    children: ["Spatial Analysis", "Raster Processing", "Vector & Geometry", "3D & Visualization", "Radar (SAR)", "Spectral Analysis", "AI & Machine Learning"]
  },
  "Earth Observation & Sciences": {
    icon: "🛰️", color: "#ccae75", // Sandy-Gold: Earthy, Observation
    description: "Remote sensing, environmental monitoring, and natural science domains",
    children: ["Remote Sensing", "Hydrology & Water", "Geology & Geophysics", "Agronomy & Soils Data", "Ecology & Environment", "Hazards & Disasters"]
  },
  "Cartography & Design": {
    icon: "🎨", color: "#d8a4a4", // Dusty-Rose: Creative, Soft
    description: "Map production, symbology, print layouts, and CAD drafting",
    children: ["Cartography & Styling", "CAD & sketching"]
  },
  "Data & Infrastructure": {
    icon: "🗄️", color: "#86c5ce", // Muted-Sky: Flow, Data
    description: "Database connections, web services, open data catalogs, and data management",
    children: ["Database & Storage", "Web Services & OGC", "Open Data & Catalogs", "OpenStreetMap"]
  },
  "Location Intelligence": {
    icon: "📍", color: "#9fa6d8", // Muted-Lavender: Logic, Path
    description: "Positioning, routing, geocoding, urban planning, and transport networks",
    children: ["GPS & Navigation", "Geocoding & Addressing", "Transport & Networks", "Cadastre & Urban Planning"]
  },
  "Developer Tools": {
    icon: "⚙️", color: "#94a3b8", // Slate: Utility
    description: "Plugin development, scripting, debugging, and automation utilities",
    children: ["Development & Scripting"]
  }
};

/**
 * Individual categories with tag lists for automatic classification.
 * Each category belongs to exactly one Realm (mapped above).
 */
const TAXONOMY = {
  // ── Geospatial Processing ──
  "AI & Machine Learning": { icon: "🤖", color: "#7fb99b", tags: ["ai", "artificial intelligence", "machine learning", "deep learning", "neural network", "classification", "segmentation", "object detection", "tensorflow", "pytorch", "onnx", "random forest", "svm", "cnn", "semantic", "supervised", "unsupervised", "training", "prediction", "model"] },
  "Spatial Analysis": { icon: "🔬", color: "#7fb99b", tags: ["analysis", "spatial", "statistics", "stats", "interpolation", "geostatistics", "buffer", "overlay", "intersection", "proximity", "density", "cluster", "hotspot", "kriging", "heatmap", "sampling"] },
  "Raster Processing": { icon: "🗺️", color: "#7fb99b", tags: ["raster", "dem", "dtm", "dsm", "elevation", "terrain", "slope", "aspect", "hillshade", "ndvi", "band", "mosaic", "resample", "pixel", "geotiff", "grid"] },
  "Vector & Geometry": { icon: "📐", color: "#7fb99b", tags: ["vector", "shapefile", "polygon", "polyline", "point", "line", "geometry", "digitizing", "snapping", "topology", "merge", "split", "dissolve", "simplify", "feature"] },
  "3D & Visualization": { icon: "🏔️", color: "#7fb99b", tags: ["3d", "visualization", "animation", "temporal", "time", "globe", "cesium", "mesh"] },

  // ── Earth Observation & Sciences ──
  "Remote Sensing": { icon: "🛰️", color: "#ccae75", tags: ["remote sensing", "satellite", "sentinel", "landsat", "modis", "classification", "drone", "uav", "ortho", "photogrammetry", "image", "earth observation"] },
  "Radar (SAR)": { icon: "📡", color: "#ccae75", tags: ["radar", "sar", "synthetic aperture", "insar", "polsar", "interferometry", "backscatter", "coherence", "polarimetry", "microwave", "snap"] },
  "Spectral Analysis": { icon: "🌈", color: "#ccae75", tags: ["spectral", "multispectral", "hyperspectral", "ndvi", "band", "reflectance", "spectroscopy", "vegetation index", "evi", "savi", "lidar"] },
  "Hydrology & Water": { icon: "💧", color: "#ccae75", tags: ["hydrology", "water", "watershed", "basin", "river", "stream", "flood", "drainage", "flow", "catchment", "groundwater"] },
  "Geology & Geophysics": { icon: "⛰️", color: "#ccae75", tags: ["geology", "geological", "stratigraphy", "borehole", "mining", "mineral", "seismic", "earthquake"] },
  "Agronomy & Soils Data": { icon: "🌾", color: "#ccae75", tags: ["agronomy", "agriculture", "crop", "farm", "farming", "soil", "soil data", "soil map", "fertilizer", "irrigation", "precision agriculture", "harvest", "yield", "pasture", "livestock", "agroforestry", "embrapa", "usda"] },
  "Ecology & Environment": { icon: "🌿", color: "#ccae75", tags: ["ecology", "environment", "environmental", "biodiversity", "habitat", "species", "wildlife", "forest", "vegetation", "land cover", "land use", "conservation", "nature"] },
  "Hazards & Disasters": { icon: "⚠️", color: "#ccae75", tags: ["risk", "hazard", "disaster", "emergency", "fire", "landslide", "tsunami", "impact", "vulnerability"] },

  // ── Cartography & Design ──
  "Cartography & Styling": { icon: "🎨", color: "#d8a4a4", tags: ["cartography", "map", "layout", "print", "composer", "legend", "scale", "atlas", "style", "symbology", "labeling", "label", "svg", "pdf", "export"] },
  "CAD & sketching": { icon: "📏", color: "#d8a4a4", tags: ["cad", "dxf", "dwg", "sketching", "sketching sketching sketching", "sketching sketching sketching"] },

  // ── Data & Infrastructure ──
  "Database & Storage": { icon: "🗄️", color: "#86c5ce", tags: ["database", "postgis", "postgresql", "spatialite", "sqlite", "mysql", "oracle", "sql", "geopackage", "gpkg", "schema", "table", "query"] },
  "Web Services & OGC": { icon: "🌐", color: "#86c5ce", tags: ["web", "wms", "wfs", "wcs", "wps", "ogc", "api", "server", "cloud", "online", "internet", "webgis", "tile", "tiles", "xyz", "tms", "wmts", "rest", "geojson", "geoserver"] },
  "Open Data & Catalogs": { icon: "📂", color: "#86c5ce", tags: ["open data", "inspire", "metadata", "catalog", "csw", "harvest", "download", "import", "load"] },
  "OpenStreetMap": { icon: "🗺️", color: "#86c5ce", tags: ["openstreetmap", "osm", "overpass", "osmosis", "opendata"] },

  // ── Location Intelligence ──
  "GPS & Navigation": { icon: "📍", color: "#9fa6d8", tags: ["gps", "gpx", "navigation", "tracking", "waypoint", "route", "garmin", "nmea", "coordinates", "coordinate", "utm", "projection", "crs", "transform", "georeferencing"] },
  "Geocoding & Addressing": { icon: "🏠", color: "#9fa6d8", tags: ["geocoding", "geocode", "address", "nominatim", "reverse", "location", "place"] },
  "Transport & Networks": { icon: "🚗", color: "#9fa6d8", tags: ["transport", "transportation", "network", "road", "routing", "shortest path", "isochrone", "accessibility", "traffic"] },
  "Cadastre & Urban Planning": { icon: "🏗️", color: "#9fa6d8", tags: ["cadastre", "cadastral", "urban", "planning", "land registration", "parcel", "building", "zoning"] },

  // ── Developer Tools ──
  "Development & Scripting": { icon: "💻", color: "#94a3b8", tags: ["development", "developer", "python", "debug", "reload", "reloader", "console", "scripting", "testing", "plugin"] }
};

// Build reverse lookup: category → realm
const CATEGORY_TO_REALM = {};
for (const [realmName, realmDef] of Object.entries(TAXONOMY_REALMS)) {
  for (const cat of realmDef.children) {
    CATEGORY_TO_REALM[cat] = realmName;
  }
}

// --- GOV / Institutional flag detection ---
const GOV_KEYWORDS = [
  "government", "gov", "ministerio", "ministry", "national", "federal", "state", "municipal",
  "agency", "agência", "institute", "instituto", "bureau", "department", "departamento",
  "survey", "geological survey", "cadastre", "bnpb", "aifdr", "gfdrr", "world bank",
  "european", "eu ", "inspire", "copernicus", "nasa", "esa", "noaa", "usgs", "ibge", "inpe",
  "conae", "ign", "bkg", "swisstopo", "ordnance", "kadaster", "embrapa"
];

// --- Country/Continent detection from author, homepage, description ---
const COUNTRY_PATTERNS = {
  "Europe": {
    "🇩🇪 Germany": ["germany", "german", "deutsch", "berlin", "münchen", "hamburg", ".de/", "bkg"],
    "🇫🇷 France": ["france", "french", "français", "paris", "lyon", "3liz", ".fr/", "ign.fr", "adour garonne"],
    "🇬🇧 United Kingdom": ["united kingdom", "uk", "british", "england", "london", "scotland", "ordnance", ".uk/", "co.uk"],
    "🇮🇹 Italy": ["italy", "italian", "italia", "itopen.it", "faunalia", ".it/"],
    "🇪🇸 Spain": ["spain", "spanish", "españa", "madrid", "barcelona", ".es/"],
    "🇵🇹 Portugal": ["portugal", "portuguese", "português", "lisboa", "porto", ".pt/"],
    "🇳🇱 Netherlands": ["netherlands", "dutch", "holland", "amsterdam", "kadaster", ".nl/"],
    "🇨🇭 Switzerland": ["switzerland", "swiss", "zurich", "zürich", "bern", "sourcepole", "swisstopo", ".ch/"],
    "🇦🇹 Austria": ["austria", "austrian", "wien", "vienna", ".at/"],
    "🇳🇴 Norway": ["norway", "norwegian", "oslo", "nina", ".no/"],
    "🇸🇪 Sweden": ["sweden", "swedish", "stockholm", ".se/"],
    "🇫🇮 Finland": ["finland", "finnish", "helsinki", ".fi/"],
    "🇵🇱 Poland": ["poland", "polish", "warszawa", "gis-support", ".pl/"],
    "🇷🇴 Romania": ["romania", "romanian", ".ro/"],
    "🇬🇷 Greece": ["greece", "greek", ".gr/"]
  },
  "Americas": {
    "🇧🇷 Brazil": ["brazil", "brazilian", "brasil", "brasileiro", "são paulo", "rio de janeiro", ".br/", "ibge", "inpe", "embrapa", "geotux"],
    "🇺🇸 United States": ["united states", "usa", "us ", "american", "washington", "california", "new york", ".gov", "usgs", "noaa", "nasa"],
    "🇨🇦 Canada": ["canada", "canadian", "toronto", "vancouver", "quebec", ".ca/"],
    "🇦🇷 Argentina": ["argentina", "argentino", "buenos aires", "conae", ".ar/"],
    "🇨🇱 Chile": ["chile", "chilean", "santiago", ".cl/"],
    "🇨🇴 Colombia": ["colombia", "colombian", "bogotá", ".co/"],
    "🇲🇽 Mexico": ["mexico", "mexican", "méxico", ".mx/"],
    "🇵🇪 Peru": ["peru", "peruvian", "lima", ".pe/"]
  },
  "Asia & Oceania": {
    "🇦🇺 Australia": ["australia", "australian", "sydney", "melbourne", "brisbane", ".au/"],
    "🇳🇿 New Zealand": ["new zealand", "zealand", ".nz/"],
    "🇯🇵 Japan": ["japan", "japanese", "tokyo", ".jp/"],
    "🇨🇳 China": ["china", "chinese", "beijing", ".cn/"],
    "🇮🇳 India": ["india", "indian", "delhi", "mumbai", ".in/"],
    "🇮🇩 Indonesia": ["indonesia", "indonesian", "jakarta", "bnpb", ".id/"],
    "🇰🇷 South Korea": ["korea", "korean", "seoul", ".kr/"],
    "🇹🇼 Taiwan": ["taiwan", "taiwanese", ".tw/"]
  },
  "Africa": {
    "🇿🇦 South Africa": ["south africa", "african", "cape town", "johannesburg", ".za/"],
    "🇰🇪 Kenya": ["kenya", "kenyan", "nairobi", ".ke/"],
    "🇳🇬 Nigeria": ["nigeria", "nigerian", ".ng/"]
  }
};

/**
 * Detect if a plugin is GOV/institutional
 */
function detectGov(plugin) {
  const text = `${plugin.description} ${plugin.about} ${plugin.author} ${plugin.homepage}`.toLowerCase();
  return GOV_KEYWORDS.some(k => text.includes(k));
}

/**
 * Detect country/continent for a plugin
 * Returns { continent, country } or null
 */
function detectCountry(plugin) {
  const text = `${plugin.author} ${plugin.homepage} ${plugin.repository} ${plugin.description} ${plugin.about}`.toLowerCase();
  for (const [continent, countries] of Object.entries(COUNTRY_PATTERNS)) {
    for (const [country, patterns] of Object.entries(countries)) {
      for (const p of patterns) {
        if (text.includes(p)) return { continent, country };
      }
    }
  }
  return null;
}

/**
 * Classify a plugin into taxonomy categories (can belong to multiple)
 */
function classifyPlugin(plugin) {
  const categories = [];
  const pluginTags = plugin.tags || [];
  const textAll = `${pluginTags.join(' ')} ${plugin.description} ${plugin.name}`.toLowerCase();
  for (const [catName, catDef] of Object.entries(TAXONOMY)) {
    for (const tag of catDef.tags) {
      if (pluginTags.includes(tag) || textAll.includes(tag)) {
        categories.push(catName);
        break;
      }
    }
  }
  if (categories.length === 0) categories.push("Others");
  return categories;
}
