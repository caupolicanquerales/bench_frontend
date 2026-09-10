import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';

export type MapLayerType = 'streets' | 'satellite' | 'dark' | 'terrain';

export interface MapLayerConfig {
  id: MapLayerType;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
  description: string;
}

@Component({
  imports: [CommonModule],
  selector: 'app-gps-map',
  standalone: true,
  styleUrl: './app-gps-map.scss',
  templateUrl: './app-gps-map.html',
})
export class AppGpsMap implements OnDestroy {
  @ViewChild('mapCanvas') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);

  // Component Signals and State
  protected isBrowser = true;
  protected activeLayer = signal<MapLayerType>('streets');
  protected isHotlineVisible = signal<boolean>(true);
  protected currentSpeedMetric = signal<string>('Avg: 12.4 km/h');
  protected weatherInfo = signal<{ temp: string; condition: string; wind: string }>({
    temp: '18°C',
    condition: 'Partly Cloudy',
    wind: '12 km/h NW',
  });

  // Reliable production-grade tile servers (OSM, CartoDB & Esri World Imagery)
  protected readonly availableLayers: MapLayerConfig[] = [
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

  private mapInstance: any = null;
  private currentTileLayer: any = null;
  private hotlineLayer: any = null;
  private overlayGroup: any = null;
  private L: any = null;
  private resizeObserver: ResizeObserver | null = null;

  // Sample GPS Track with latitude, longitude, and speed (km/h) for hotline
  private readonly gpsTrackPoints: [number, number, number][] = [
    [40.4150, -3.7080, 8.5],
    [40.4162, -3.7055, 9.8],
    [40.4175, -3.7030, 11.2],
    [40.4190, -3.7010, 12.6],
    [40.4205, -3.6990, 13.8],
    [40.4220, -3.6975, 14.5],
    [40.4245, -3.6960, 15.2],
    [40.4270, -3.6945, 14.1],
    [40.4290, -3.6930, 12.3],
    [40.4310, -3.6910, 10.5],
    [40.4325, -3.6890, 9.2],
    [40.4340, -3.6865, 11.0],
    [40.4352, -3.6840, 13.1],
    [40.4365, -3.6810, 14.9],
    [40.4380, -3.6780, 16.0],
    [40.4395, -3.6750, 14.8],
    [40.4410, -3.6720, 12.5],
    [40.4420, -3.6690, 10.8],
  ];

  constructor() {
    // Executes strictly on the client browser after initial render
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      // 1. Resolve Leaflet: Prefer global L (from scripts bundle) to avoid ESM closure scope issues,
      // fallback to dynamic import/require if not yet available
      let L = typeof window !== 'undefined' ? (window as any).L : null;

      if (!L) {
        try {
          const leafletMod: any = await import('leaflet');
          L = leafletMod.default?.map
            ? leafletMod.default
            : (leafletMod.map ? leafletMod : (leafletMod.default ?? leafletMod));
        } catch {
          // If commonjs require is available in bundler context
          if (typeof (window as any).require === 'function') {
            L = (window as any).require('leaflet');
          }
        }
      }

      // Expose L globally so plugins can bind to it
      if (typeof window !== 'undefined') {
        (window as any).L = L;
      }

      // 2. Resolve leaflet-hotline plugin: ensure L.hotline is bound
      if (L && !L.hotline) {
        try {
          const hotlineModule: any = await import('leaflet-hotline');
          const hotlineFn = typeof hotlineModule === 'function'
            ? hotlineModule
            : (hotlineModule?.default ?? hotlineModule);

          if (typeof hotlineFn === 'function') {
            hotlineFn(L);
          }
        } catch (err) {
          console.warn('Failed to load leaflet-hotline dynamically:', err);
        }
      }

      this.L = L;

      // 3. Initialize Map manually
      if (this.mapContainer?.nativeElement && L?.map) {
        this.mapInstance = L.map(this.mapContainer.nativeElement, {
          zoomControl: false,
          attributionControl: false,
        }).setView([40.4168, -3.7038], 13);

        L.control.zoom({ position: 'bottomright' }).addTo(this.mapInstance);

        // Apply initial tile layer
        this.applyTileLayer(this.activeLayer());

        // Telemetry overlay group
        this.overlayGroup = L.layerGroup().addTo(this.mapInstance);

        // Build Hotline & Start/Finish markers
        this.buildHotlineLayer(L);

        // Fit map bounds to GPS track
        const bounds = L.latLngBounds(
          this.gpsTrackPoints.map(([lat, lng]) => [lat, lng] as [number, number]),
        );
        this.mapInstance.fitBounds(bounds, { padding: [40, 40] });

        // Force canvas re-render and trigger size recalculations once layout settles
        setTimeout(() => {
          if (this.mapInstance) {
            this.mapInstance.invalidateSize({ animate: false });
          }
        }, 300);

        [100, 250, 500].forEach((delay) => {
          setTimeout(() => {
            if (this.mapInstance) {
              this.mapInstance.invalidateSize();
            }
          }, delay);
        });

        // Continuously adapt when container size changes
        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => {
            if (this.mapInstance) {
              this.mapInstance.invalidateSize();
            }
          });
          this.resizeObserver.observe(this.mapContainer.nativeElement);
        }
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  /**
   * Swap map tile layer style.
   */
  public switchLayer(layerId: MapLayerType): void {
    this.activeLayer.set(layerId);
    if (this.mapInstance) {
      this.applyTileLayer(layerId);
    }
  }

  /**
   * Toggle visibility of hotline speed gradient track.
   */
  public toggleHotline(): void {
    const nextState = !this.isHotlineVisible();
    this.isHotlineVisible.set(nextState);

    if (!this.mapInstance || !this.hotlineLayer) {
      return;
    }

    if (nextState) {
      if (!this.mapInstance.hasLayer(this.hotlineLayer)) {
        this.hotlineLayer.addTo(this.mapInstance);
      }
    } else {
      if (this.mapInstance.hasLayer(this.hotlineLayer)) {
        this.mapInstance.removeLayer(this.hotlineLayer);
      }
    }
  }

  /**
   * Re-center map to activity bounds.
   */
  public recenterTrack(): void {
    if (!this.mapInstance || !this.L) {
      return;
    }
    const bounds = this.gpsTrackPoints.map(([lat, lng]) => [lat, lng] as [number, number]);
    this.mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }

  /**
   * Apply selected tile layer with automatic fallback to OpenStreetMap if loading fails.
   */
  private applyTileLayer(type: MapLayerType): void {
    if (!this.mapInstance || !this.L) {
      return;
    }

    const config = this.availableLayers.find((l) => l.id === type) ?? this.availableLayers[0];

    if (this.currentTileLayer) {
      this.mapInstance.removeLayer(this.currentTileLayer);
      this.currentTileLayer = null;
    }

    const tileOptions: any = {
      maxZoom: config.maxZoom ?? 19,
      attribution: config.attribution,
    };

    if (config.subdomains && config.subdomains.length > 0) {
      tileOptions.subdomains = config.subdomains;
    }

    try {
      this.currentTileLayer = this.L.tileLayer(config.url, tileOptions).addTo(this.mapInstance);

      // Robust fallback: if tiles fail (e.g., external tile service 403 or network issue), fall back to OpenStreetMap
      let fallbackTriggered = false;
      this.currentTileLayer.on('tileerror', () => {
        if (!fallbackTriggered && config.id !== 'streets' && this.mapInstance) {
          fallbackTriggered = true;
          const fallbackOsmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
          this.mapInstance.removeLayer(this.currentTileLayer);
          this.currentTileLayer = this.L.tileLayer(fallbackOsmUrl, {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c'],
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(this.mapInstance);
          this.currentTileLayer.bringToBack();
        }
      });

      this.currentTileLayer.bringToBack();
    } catch {
      // Fallback directly to OSM if initialization throws
      const fallbackOsmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      this.currentTileLayer = this.L.tileLayer(fallbackOsmUrl, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.mapInstance);
      this.currentTileLayer.bringToBack();
    }
  }

  private buildHotlineLayer(L: any): void {
    if (!this.mapInstance) {
      return;
    }

    // Start and Finish Markers
    const startPoint = this.gpsTrackPoints[0];
    const finishPoint = this.gpsTrackPoints[this.gpsTrackPoints.length - 1];

    const startIcon = L.divIcon({
      className: 'gps-marker-container',
      html: '<div class="gps-pin start-pin"><span class="pin-inner">A</span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const finishIcon = L.divIcon({
      className: 'gps-marker-container',
      html: '<div class="gps-pin finish-pin"><span class="pin-inner">B</span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([startPoint[0], startPoint[1]], { icon: startIcon })
      .bindTooltip('Start Line', { permanent: false, direction: 'top' })
      .addTo(this.overlayGroup ?? this.mapInstance);

    L.marker([finishPoint[0], finishPoint[1]], { icon: finishIcon })
      .bindTooltip('Finish (21.3 km)', { permanent: false, direction: 'top' })
      .addTo(this.overlayGroup ?? this.mapInstance);

    // Leaflet.hotline speed gradient
    if (typeof L.hotline === 'function') {
      this.hotlineLayer = L.hotline(this.gpsTrackPoints, {
        min: 8,
        max: 16,
        palette: {
          0.0: '#10b981', // green
          0.5: '#f59e0b', // amber
          1.0: '#ef4444', // red
        },
        weight: 6,
        outlineColor: '#0f172a',
        outlineWidth: 1.5,
      });

      if (this.isHotlineVisible()) {
        this.hotlineLayer.addTo(this.mapInstance);
      }
    }
  }
}

