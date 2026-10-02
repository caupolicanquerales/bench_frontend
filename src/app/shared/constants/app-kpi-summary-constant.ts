export type KpiSummaryAccentType = 'distance' | 'time' | 'pace' | 'elevation' | 'calories';

export interface KpiSummaryMetricConfig {
  id: string;
  name: string;
  description: string;
  unit: string;
  accentType: KpiSummaryAccentType;
  isPrimary?: boolean;
  badge?: {
    text: string;
    type: 'positive' | 'warning' | 'neutral' | 'accent';
  };
  tooltip: string;
  formatter?: (value: number) => string;
}

const formatPace = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00';
  }

  const minutes = Math.floor(value);
  const seconds = Math.round((value - minutes) * 60);
  const safeSeconds = Math.min(seconds, 59);

  return `${minutes}:${safeSeconds.toString().padStart(2, '0')}`;
};

const formatDuration = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00:00';
  }

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const kpiSummaryMetricConfig: Record<string, KpiSummaryMetricConfig> = {
  totalDistanceM: {
    id: 'totalDistanceM',
    name: 'Distance',
    description: 'DISTANCE',
    unit: 'km',
    accentType: 'distance',
    isPrimary: true,
    badge: { text: 'Target 21k', type: 'accent' },
    tooltip: 'Filter map track by distance milestones',
    formatter: (value) => (value / 1000).toFixed(2),
  },
  totalTimeSeconds: {
    id: 'totalTimeSeconds',
    name: 'Time',
    description: 'TIME',
    unit: '',
    accentType: 'time',
    badge: { text: 'Duration', type: 'positive' },
    tooltip: 'Filter telemetry timeline by duration',
    formatter: (value) => formatDuration(value),
  },
  avgSpeedKmh: {
    id: 'avgSpeedKmh',
    name: 'Avg Speed',
    description: 'AVG PACE',
    unit: 'km/h',
    accentType: 'pace',
    badge: { text: 'Smooth', type: 'warning' },
    tooltip: 'Highlight current pace bands on the GPS track',
    formatter: (value) => Number(value).toFixed(1),
  },
  avgPaceMinPerKm: {
    id: 'avgPaceMinPerKm',
    name: 'Pace',
    description: 'AVG PACE',
    unit: '/km',
    accentType: 'pace',
    badge: { text: 'Regular', type: 'neutral' },
    tooltip: 'Show pacing trend across the route',
    formatter: (value) => formatPace(value),
  },
  avgHeartRate: {
    id: 'avgHeartRate',
    name: 'Avg HR',
    description: 'AVG HR',
    unit: 'bpm',
    accentType: 'calories',
    badge: { text: 'Stable', type: 'neutral' },
    tooltip: 'Average heart rate across the activity',
    formatter: (value) => String(Math.round(value)),
  },
  maxHeartRate: {
    id: 'maxHeartRate',
    name: 'Max HR',
    description: 'MAX HR',
    unit: 'bpm',
    accentType: 'calories',
    badge: { text: 'Peak', type: 'warning' },
    tooltip: 'Maximum heart rate reached during the workout',
    formatter: (value) => String(Math.round(value)),
  },
  avgPower: {
    id: 'avgPower',
    name: 'Avg Power',
    description: 'AVG POWER',
    unit: 'W',
    accentType: 'calories',
    badge: { text: 'Effort', type: 'neutral' },
    tooltip: 'Average power output during the session',
    formatter: (value) => String(Math.round(value)),
  },
  maxPower: {
    id: 'maxPower',
    name: 'Peak Power',
    description: 'PEAK POWER',
    unit: 'W',
    accentType: 'calories',
    badge: { text: 'Spike', type: 'accent' },
    tooltip: 'Highest power output reached on the route',
    formatter: (value) => String(Math.round(value)),
  },
  avgCadence: {
    id: 'avgCadence',
    name: 'Avg Cadence',
    description: 'AVG CADENCE',
    unit: 'spm',
    accentType: 'pace',
    badge: { text: 'Rhythm', type: 'positive' },
    tooltip: 'Average cadence maintained during the session',
    formatter: (value) => String(Math.round(value)),
  },
};
