import { CommonModule, isPlatformBrowser } from '@angular/common';
import { availableLayerConst } from '../shared/constants/app-gps-maps-constant';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { GeneralService } from '../services/general.service';
import { SseEndpointService } from '../services/sse-endpoint-service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { GarminGpsModel } from '../models/garmin-gps.model';
import { convertFileToFormData } from '../utils/file.util';

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
export class AppGpsMap implements OnInit, OnDestroy {
  @ViewChild('mapCanvas') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);

  // Component Signals and State
  protected isBrowser = true;
  protected hasTrackData = signal<boolean>(false);
  protected isDropTarget = signal<boolean>(false);
  protected activeLayer = signal<MapLayerType>('streets');
  protected isHotlineVisible = signal<boolean>(true);
  protected currentSpeedMetric = signal<string>('--');
  protected weatherInfo = signal<{ temp: string; condition: string; wind: string }>({
    temp: '--',
    condition: 'No activity loaded',
    wind: '--',
  });

  // Reliable production-grade tile servers (OSM, CartoDB & Esri World Imagery)
  protected readonly availableLayers: MapLayerConfig[] = availableLayerConst;

  private mapInstance: any = null;
  private currentTileLayer: any = null;
  private hotlineLayer: any = null;
  private overlayGroup: any = null;
  private L: any = null;
  private fileInputEl: HTMLInputElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();

  // Sample GPS Track with latitude, longitude, and speed (km/h) for hotline
  private gpsTrackPoints: [number, number, number][] = [];

  constructor(private generalService: GeneralService,
    private sseEndpointService: SseEndpointService
  ) {
    // Executes strictly on the client browser after initial render
    afterNextRender(async () => {
      await this.initMapIfNeeded();
    });
  }
  ngOnInit(): void {
    this.generalService.gpsData$.pipe(takeUntil(this.destroy$)).subscribe((gpsData) => this.setSubscriptionToGpsData(gpsData));
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
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async resolveLeaflet(): Promise<any> {
    if (this.L) {
      return this.L;
    }

    let L = typeof window !== 'undefined' ? (window as any).L : null;

    if (!L) {
      try {
        const leafletMod: any = await import('leaflet');
        L = leafletMod.default?.map
          ? leafletMod.default
          : (leafletMod.map ? leafletMod : (leafletMod.default ?? leafletMod));
      } catch {
        if (typeof (window as any).require === 'function') {
          L = (window as any).require('leaflet');
        }
      }
    }

    if (typeof window !== 'undefined') {
      (window as any).L = L;
    }

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
    return L;
  }

  private async initMapIfNeeded(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (this.mapInstance) {
      return true;
    }

    if (!this.mapContainer?.nativeElement) {
      return false;
    }

    const L = await this.resolveLeaflet();

    if (this.mapContainer?.nativeElement && L?.map && !this.mapInstance) {
      this.mapInstance = L.map(this.mapContainer.nativeElement, {
        zoomControl: false,
        attributionControl: false,
      });

      this.applyInitialMapCenter();

      L.control.zoom({ position: 'bottomright' }).addTo(this.mapInstance);

      // Apply initial tile layer
      this.applyTileLayer(this.activeLayer());

      // Telemetry overlay group
      this.overlayGroup = L.layerGroup().addTo(this.mapInstance);

      // If we already have track data, build the visualization
      if (this.gpsTrackPoints.length > 0) {
        this.refreshTrackVisualization();
      }

      // Continuously adapt when container size changes
      if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.mapInstance) {
            this.mapInstance.invalidateSize();
          }
        });
        this.resizeObserver.observe(this.mapContainer.nativeElement);
      }

      return true;
    }

    return false;
  }

  /**
   * Set the initial map center using browser geolocation when available.
   * Falls back to Madrid only when location access is denied or unavailable.
   */
  private applyInitialMapCenter(): void {
    if (!this.mapInstance || !this.L) {
      return;
    }

    const madridFallback: [number, number] = [40.4168, -3.7038];

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.mapInstance.setView(
            [position.coords.latitude, position.coords.longitude],
            12,
          );
        },
        () => {
          this.mapInstance.setView(madridFallback, 13);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        },
      );
      return;
    }

    this.mapInstance.setView(madridFallback, 13);
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

  private refreshTrackVisualization(): void {
    if (!this.mapInstance || !this.L || this.gpsTrackPoints.length === 0) {
      return;
    }

    if (this.hotlineLayer) {
      this.mapInstance.removeLayer(this.hotlineLayer);
      this.hotlineLayer = null;
    }

    if (this.overlayGroup) {
      this.overlayGroup.clearLayers();
    }

    this.buildHotlineLayer(this.L);

    const bounds = this.L.latLngBounds(
      this.gpsTrackPoints.map(([lat, lng]) => [lat, lng] as [number, number]),
    );
    this.mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }

  private buildHotlineLayer(L: any): void {
    if (!this.mapInstance || this.gpsTrackPoints.length === 0) {
      return;
    }

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
      .bindTooltip('Finish', { permanent: false, direction: 'top' })
      .addTo(this.overlayGroup ?? this.mapInstance);

    if (typeof L.hotline === 'function') {
      this.hotlineLayer = L.hotline(this.gpsTrackPoints, {
        min: 8,
        max: 16,
        palette: {
          0.0: '#10b981',
          0.5: '#f59e0b',
          1.0: '#ef4444',
        },
        weight: 6,
        outlineColor: '#0f172a',
        outlineWidth: 1.5,
      });

      if (this.isHotlineVisible()) {
        this.hotlineLayer.addTo(this.mapInstance);
      }
    } else {
      const latLngs = this.gpsTrackPoints.map(([lat, lng]) => [lat, lng] as [number, number]);
      this.hotlineLayer = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.9,
      });
      if (this.isHotlineVisible()) {
        this.hotlineLayer.addTo(this.mapInstance);
      }
    }
  }

  protected triggerEmptyStateUpload(): void {
    if (!this.fileInputEl) {
      this.fileInputEl = document.createElement('input');
      this.fileInputEl.type = 'file';
      this.fileInputEl.accept = '.csv,.fit,.gpx,.tcx';
      this.fileInputEl.style.display = 'none';
      this.fileInputEl.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          this.uploadActivityFile(file);
        }
        target.value = '';
      });
      document.body.appendChild(this.fileInputEl);
    }

    this.fileInputEl.click();
  }

  protected onEmptyStateDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.isDropTarget.set(true);
  }

  protected onEmptyStateDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDropTarget.set(false);
  }

  protected onEmptyStateDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDropTarget.set(false);

    const file = event.dataTransfer && event.dataTransfer.files.length > 0
      ? event.dataTransfer.files[0]
      : null;
    if (file) {
      this.uploadActivityFile(file);
    }
  }

  private uploadActivityFile(file: File): void {
    this.hasTrackData.set(false);
    this.generalService.setSummaryData(false);
    this.generalService.setChartsData(false);
    this.generalService.setGpsData(false);

    const formData = convertFileToFormData(file);

    this.subscriptions.add(
      this.sseEndpointService.saveRawFile(formData).subscribe({
        next: () => {
          this.generalService.setSummaryData(true);
          this.generalService.setChartsData(true);
          this.generalService.setGpsData(true);
        },
        error: () => {
          this.generalService.setSummaryData(false);
          this.generalService.setChartsData(false);
          this.generalService.setGpsData(false);
        },
      })
    );
  }

  private setSubscriptionToGpsData(executing: boolean): void {
    if (!executing) {
      this.hasTrackData.set(false);
      this.gpsTrackPoints = [];
      this.currentSpeedMetric.set('--');
      this.weatherInfo.set({
        temp: '--',
        condition: 'No activity loaded',
        wind: '--',
      });
      if (this.hotlineLayer && this.mapInstance) {
        this.mapInstance.removeLayer(this.hotlineLayer);
        this.hotlineLayer = null;
      }
      if (this.overlayGroup) {
        this.overlayGroup.clearLayers();
      }
      return;
    }

    this.subscriptions.add(
      this.sseEndpointService.getGpsData().subscribe({
        next: async (response) => {
          const track = Array.isArray(response?.data)
            ? response.data
            : [];

          this.hasTrackData.set(track.length > 0);
          this.gpsTrackPoints = track.map((point: GarminGpsModel) => [
            Number(point.latitude),
            Number(point.longitude),
            Number(point.speedKmH),
          ] as [number, number, number]);

          if (this.gpsTrackPoints.length > 0) {
            const avgSpeed = (
              this.gpsTrackPoints.reduce((sum, [, , speed]) => sum + speed, 0) /
              this.gpsTrackPoints.length
            ).toFixed(1);
            this.currentSpeedMetric.set(`Avg: ${avgSpeed} km/h`);
            this.weatherInfo.set({
              temp: '18°C',
              condition: 'Partly Cloudy',
              wind: '12 km/h NW',
            });

            await this.initMapIfNeeded();
            [50, 150, 300, 600].forEach((delay) => {
              setTimeout(() => {
                if (this.mapInstance) {
                  this.mapInstance.invalidateSize({ animate: false });
                  this.refreshTrackVisualization();
                }
              }, delay);
            });
          } else {
            this.currentSpeedMetric.set('--');
            this.weatherInfo.set({
              temp: '--',
              condition: 'No activity loaded',
              wind: '--',
            });
          }

          console.log('GPS Data received:', this.gpsTrackPoints.length, 'points');
        },
        error: (err) => {
          this.hasTrackData.set(false);
          this.gpsTrackPoints = [];
          this.currentSpeedMetric.set('--');
          this.weatherInfo.set({
            temp: '--',
            condition: 'No activity loaded',
            wind: '--',
          });
          console.log('GPS Data error:', err);
        },
      })
    );
  }
}

