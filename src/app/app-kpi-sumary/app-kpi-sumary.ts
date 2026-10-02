import { Component, output, signal, OnInit, OnDestroy } from '@angular/core';
import { GeneralService } from '../services/general.service';
import { SseEndpointService } from '../services/sse-endpoint-service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { GarminSummaryModel } from '../models/garmin-summary.model';
import { kpiSummaryMetricConfig } from '../shared/constants/app-kpi-summary-constant';

export interface KpiMetric {
  id: string;
  name: string;
  value: string;
  unit: string;
  description: string;
  isPrimary?: boolean;
  accentType?: 'distance' | 'time' | 'pace' | 'elevation' | 'calories';
  badge?: {
    text: string;
    type: 'positive' | 'warning' | 'neutral' | 'accent';
  };
  tooltip: string;
}

@Component({
  imports: [],
  selector: 'app-kpi-sumary',
  standalone: true,
  styleUrl: './app-kpi-sumary.scss',
  templateUrl: './app-kpi-sumary.html',
})
export class AppKpiSumary implements OnInit, OnDestroy {
  public readonly metricSelected = output<string>();

  protected selectedMetricId = signal<string>('totalDistanceM');
  protected hoveredMetricId = signal<string | null>(null);
  subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();

  protected metrics = signal<KpiMetric[]>([]);

  constructor(private generalService: GeneralService,
      private sseEndpointService: SseEndpointService) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
      this.generalService.summaryData$.pipe(takeUntil(this.destroy$)).subscribe((summaryData) => this.setSubscriptionToSummaryData(summaryData));
  }

  protected selectMetric(id: string): void {
    this.selectedMetricId.set(id);
    this.metricSelected.emit(id);
  }

  protected setHoveredMetric(id: string | null): void {
    this.hoveredMetricId.set(id);
  }

  private setSubscriptionToSummaryData(summaryData: boolean): void{
    if (!summaryData) {
      return;
    }

    this.subscriptions.add(
      this.sseEndpointService.getSummaryData().subscribe({
        next: (response) => {
          const summary = (response?.data && typeof response.data === 'object' && !Array.isArray(response.data))
            ? response.data as GarminSummaryModel
            : null;

          this.metrics.set(this.buildMetrics(summary));
          console.log('Summary Data received:', response);
        },
        error: (err) =>{
          console.log('Summary Data error:', err);
        },
      })
    );
  }

  private buildMetrics(summary: GarminSummaryModel | null): KpiMetric[] {
    if (!summary) {
      return [];
    }

    const summaryRecord = summary as unknown as Record<string, number | undefined>;

    return Object.keys(kpiSummaryMetricConfig)
      .filter((metricId) => typeof summaryRecord[metricId] !== 'undefined')
      .map((metricId) => {
        const config = kpiSummaryMetricConfig[metricId];
        const rawValue = Number(summaryRecord[metricId] ?? 0);
        const value = config.formatter ? config.formatter(rawValue) : String(rawValue);

        return {
          id: metricId,
          name: config.name,
          value,
          unit: config.unit,
          description: config.description,
          isPrimary: config.isPrimary,
          accentType: config.accentType,
          badge: config.badge,
          tooltip: config.tooltip,
        } satisfies KpiMetric;
      });
  }
}
