import { MapLayerConfig } from "../../app-gps-map/app-gps-map";

export const availableLayerConst: MapLayerConfig[] = [
    {
      id: 'streets',
      label: 'Streets',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      description: 'OpenStreetMap standard streets view (reliable, cloud-safe)',
    },
    {
      id: 'dark',
      label: 'Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 20,
      description: 'CartoDB Dark Matter (high-contrast dashboard endurance theme)',
    },
    {
      id: 'terrain',
      label: 'Terrain',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 20,
      description: 'CartoDB Voyager / Outdoor elevation style',
    },
    {
      id: 'satellite',
      label: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19,
      description: 'Esri World Imagery (high-resolution global satellite)',
    },
  ];