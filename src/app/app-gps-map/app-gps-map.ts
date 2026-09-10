import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  signal,
  ViewChild,
} from '@angular/core';

export type GoogleMapType = 'roadmap' | 'satellite' | 'terrain';

export interface MapLayerConfig {
  id: GoogleMapType;
  label: string;
  lyrs: string;
  description: string;
}

@Component({
  imports: [CommonModule],
  selector: 'app-gps-map',
  standalone: true,
  styleUrl: './app-gps-map.scss',
  templateUrl: './app-gps-map.html',
})
export class AppGpsMap {
  @ViewChild('mapCanvas') mapContainer!: ElementRef<HTMLDivElement>;

  // Component Signals and State
  protected isBrowser = true;
  protected activeLayer = signal<GoogleMapType>('terrain');
  protected isHotlineVisible = signal<boolean>(true);
  protected currentSpeedMetric = signal<string>('Avg: 12.4 km/h');
  protected weatherInfo = signal<{ temp: string; condition: string; wind: string }>({
    temp: '18°C',
    condition: 'Partly Cloudy',
    wind: '12 km/h NW',
  });

  // Available Google Map visual styles via lyrs parameter
  protected readonly availableLayers: MapLayerConfig[] = [
    {
      id: 'roadmap',
      label: 'Roadmap',
      lyrs: 'm',
      description: 'Standard Roadmap view (clean, high contrast)',
    },
    {
      id: 'satellite',
      label: 'Satellite',
      lyrs: 's',
      description: 'Google Satellite imagery',
    },
    {
      id: 'terrain',
      label: 'Terrain',
      lyrs: 'p',
      description: 'Google Terrain / Hybrid (elevation & trails)',
    },
  ];

  private mapInstance: any = null;
  private currentTileLayer: any = null;
  private hotlineLayer: any = null;
  private overlayGroup: any = null;
  private L: any = null;

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
      // 1. Dynamically import Leaflet & Plugins only on browser
      const L = await import('leaflet');
      const hotlineModule: any = await import('leaflet-hotline');
      if (typeof hotlineModule === 'function') {
        hotlineModule(L);
      } else if (typeof hotlineModule?.default === 'function') {
        hotlineModule.default(L);
      }
      this.L = L;

      // 2. Initialize Map manually
      if (this.mapContainer?.nativeElement) {
        this.mapInstance = L.map(this.mapContainer.nativeElement, {
          zoomControl: false,
          attributionControl: false,
        }).setView([40.4168, -3.7038], 13);

        L.control.zoom({ position: 'bottomright' }).addTo(this.mapInstance);

        // Apply Google Tile Layer
        this.applyGoogleTileLayer(this.activeLayer());

        // Telemetry overlay group
        this.overlayGroup = L.layerGroup().addTo(this.mapInstance);

        // Build Hotline & Start/Finish markers
        this.buildHotlineLayer(L);

        // Fit map bounds to GPS track
        const bounds = L.latLngBounds(
          this.gpsTrackPoints.map(([lat, lng]) => [lat, lng] as [number, number]),
        );
        this.mapInstance.fitBounds(bounds, { padding: [40, 40] });

        // Invalidate map size after rendering settles
        setTimeout(() => {
          this.mapInstance?.invalidateSize();
        }, 200);
      }
    });
  }

  /**
   * Swap Google Map layer by altering `lyrs` URL parameter.
   */
  public switchLayer(layerId: GoogleMapType): void {
    this.activeLayer.set(layerId);
    if (this.mapInstance) {
      this.applyGoogleTileLayer(layerId);
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

  private applyGoogleTileLayer(type: GoogleMapType): void {
    if (!this.mapInstance || !this.L) {
      return;
    }

    const config = this.availableLayers.find((l) => l.id === type) ?? this.availableLayers[0];
    const googleTilesUrl = `https://mt1.google.com/vt/lyrs=${config.lyrs}&x={x}&y={y}&z={z}`;

    if (this.currentTileLayer) {
      this.mapInstance.removeLayer(this.currentTileLayer);
    }

    this.currentTileLayer = this.L.tileLayer(googleTilesUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    }).addTo(this.mapInstance);

    this.currentTileLayer.bringToBack();
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

