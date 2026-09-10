import { Component, output, signal } from '@angular/core';

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
export class AppKpiSumary {
  public readonly metricSelected = output<string>();

  protected selectedMetricId = signal<string>('distance');
  protected hoveredMetricId = signal<string | null>(null);

  protected metrics = signal<KpiMetric[]>([
    {
      id: 'distance',
      name: 'Distancia',
      value: '21.30',
      unit: 'km',
      description: 'DISTANCE',
      isPrimary: true,
      accentType: 'distance',
      badge: {
        text: 'Target 21k',
        type: 'accent',
      },
      tooltip: 'Filter map track by distance milestones',
    },
    {
      id: 'time',
      name: 'Tiempo',
      value: '1:55:39',
      unit: '',
      description: 'TIME',
      accentType: 'time',
      badge: {
        text: '-3:20',
        type: 'positive',
      },
      tooltip: 'Filter telemetry timeline by duration',
    },
    {
      id: 'pace',
      name: 'Ritmo medio',
      value: '5:26',
      unit: '/km',
      description: 'AVG PACE',
      accentType: 'pace',
      badge: {
        text: '+0:12',
        type: 'warning',
      },
      tooltip: 'Highlight fast & slow pace splits on GPS track',
    },
    {
      id: 'elevation',
      name: 'Ascenso total',
      value: '180',
      unit: 'm',
      description: 'ELEVATION',
      accentType: 'elevation',
      badge: {
        text: '+4.2%',
        type: 'neutral',
      },
      tooltip: 'Highlight elevation spikes on map & profile chart',
    },
    {
      id: 'calories',
      name: 'Calorías',
      value: '1,051',
      unit: 'kcal',
      description: 'CALORIES',
      accentType: 'calories',
      badge: {
        text: '105% Goal',
        type: 'neutral',
      },
      tooltip: 'Show metabolic burn rate intervals',
    },
  ]);

  protected selectMetric(id: string): void {
    this.selectedMetricId.set(id);
    this.metricSelected.emit(id);
  }

  protected setHoveredMetric(id: string | null): void {
    this.hoveredMetricId.set(id);
  }
}
