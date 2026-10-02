import { Component, ChangeDetectorRef, signal, type Signal } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { GeneralService } from '../services/general.service';
import { SseEndpointService } from '../services/sse-endpoint-service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { GarminChartModel } from '../models/garmin-chart.model';
import { buildTelemetryMetricChartOption, telemetryChartEmptyOption } from '../shared/constants/app-telemetry-chart.constant';

interface TelemetryHudState {
  time: string;
  power: string;
  heartRate: string;
  cadence: string;
}

interface TelemetryChartConfig {
  key: string;
  title: string;
  ariaLabel: string;
  option: Signal<EChartsOption>;
}

@Component({
  imports: [NgxEchartsDirective],
  selector: 'app-telemetry-chart',
  standalone: true,
  styleUrl: './app-telemetry-chart.scss',
  templateUrl: './app-telemetry-chart.html',
})
export class AppTelemetryChart {

  subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();
  protected heartRateChartOption = signal<EChartsOption>(telemetryChartEmptyOption);
  protected powerChartOption = signal<EChartsOption>(telemetryChartEmptyOption);
  protected cadenceChartOption = signal<EChartsOption>(telemetryChartEmptyOption);
  protected speedChartOption = signal<EChartsOption>(telemetryChartEmptyOption);
  protected sharedHud = signal<TelemetryHudState | null>(null);
  protected hasTelemetryData = signal<boolean>(false);
  private latestChartData: GarminChartModel[] = [];
  private chartInstances: Record<string, any> = {};
  protected telemetryCharts: TelemetryChartConfig[] = [
    { key: 'heartRate', title: 'Heart rate', ariaLabel: 'Heart rate chart', option: this.heartRateChartOption },
    { key: 'power', title: 'Power', ariaLabel: 'Power chart', option: this.powerChartOption },
    { key: 'cadence', title: 'Cadence', ariaLabel: 'Cadence chart', option: this.cadenceChartOption },
    { key: 'speed', title: 'Speed (km/h)', ariaLabel: 'Speed chart', option: this.speedChartOption },
  ];

  constructor(
    private generalService: GeneralService,
    private sseEndpointService: SseEndpointService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
      this.generalService.chartsData$.pipe(takeUntil(this.destroy$)).subscribe((chartsData) => this.setSubscriptionToChartsData(chartsData));
  }

  protected onChartInit(instance: any, key: string): void {
    this.chartInstances[key] = instance;
  }

  protected onChartMouseMove(key: string, params: any): void {
    if (!params || !Array.isArray(this.latestChartData) || this.latestChartData.length === 0) {
      return;
    }

    const index = Number.isFinite(params.dataIndex) ? Number(params.dataIndex) : 0;
    const point = this.latestChartData[Math.min(Math.max(index, 0), this.latestChartData.length - 1)];
    if (!point) {
      return;
    }

    const timeValue = point.bucket ? this.toElapsedMinutes(point.bucket, this.latestChartData[0]?.bucket) : 0;
    const power = this.toNumber(point.power);
    const heartRate = this.toNumber(point.heartRate);
    const cadence = this.toNumber(point.cadence);

    this.sharedHud.set({
      time: this.formatMinutesToLabel(timeValue),
      power: `${Math.round(power)} W`,
      heartRate: `${Math.round(heartRate)} bpm`,
      cadence: `${Math.round(cadence)} rpm`
    });

    const activeKeys = ['heartRate', 'power', 'cadence'];
    activeKeys.forEach((chartKey) => {
      const chart = this.chartInstances[chartKey];
      if (chart && chart.dispatchAction) {
        chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: index });
      }
    });
  }

  protected onChartMouseLeave(): void {
    this.sharedHud.set(null);
  }

  private setSubscriptionToChartsData(chartsData: boolean): void {
    if (!chartsData) {
      return;
    }

    this.subscriptions.add(
      this.sseEndpointService.getChartsData().subscribe({
        next: (response) => {
          const chart: GarminChartModel[] = Array.isArray(response?.data)
            ? response.data as GarminChartModel[]
            : [];

          this.hasTelemetryData.set(chart.length > 0);
          this.latestChartData = chart;
          const elapsedMinutes = chart.map((point) => this.toElapsedMinutes(point.bucket, chart[0]?.bucket));

          this.heartRateChartOption.set(this.buildMetricChartOption(elapsedMinutes, 'Heart rate (bpm)', chart.map((point) => this.toNumber(point.heartRate)), '#ef4444'));
          this.powerChartOption.set(this.buildMetricChartOption(elapsedMinutes, 'Power (W)', chart.map((point) => this.toNumber(point.power)), '#3b82f6'));
          this.cadenceChartOption.set(this.buildMetricChartOption(elapsedMinutes, 'Cadence (rpm)', chart.map((point) => this.toNumber(point.cadence)), '#10b981'));
          this.speedChartOption.set(this.buildMetricChartOption(elapsedMinutes, 'Speed (km/h)', chart.map((point) => this.toNumber((point as Partial<Record<'speedKmh' | 'speedKmH', number>>).speedKmh ?? (point as Partial<Record<'speedKmh' | 'speedKmH', number>>).speedKmH)), '#f59e0b'));

          this.cdr.markForCheck();
          console.log('Charts Data received:', response);
        },
        error: (err) => {
          this.hasTelemetryData.set(false);
          console.log('Charts Data error:', err);
        },
      })
    );
  }

  private buildMetricChartOption(elapsedMinutes: number[], title: string, data: number[], color: string): EChartsOption {
    return buildTelemetryMetricChartOption(elapsedMinutes, title, data, color);
  }

  private toElapsedMinutes(bucket: Date | string | null | undefined, firstBucket: Date | string | null | undefined): number {
    if (!bucket) {
      return 0;
    }

    const currentDate = new Date(bucket);
    if (Number.isNaN(currentDate.getTime())) {
      return 0;
    }

    const startDate = firstBucket ? new Date(firstBucket) : currentDate;
    if (Number.isNaN(startDate.getTime())) {
      return 0;
    }

    return Math.max(0, (currentDate.getTime() - startDate.getTime()) / 60000);
  }

  private toNumber(value: number | string | null | undefined): number {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : 0;
  }

  private formatMinutesToLabel(totalMinutes: number): string {
    const safeMinutes = Math.max(0, Math.round(totalMinutes));
    const minutes = Math.floor(safeMinutes / 60);
    const seconds = safeMinutes % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
