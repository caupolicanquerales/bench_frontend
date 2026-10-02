import type { EChartsOption } from 'echarts';

export interface TelemetrySeriesConfig {
  name: string;
  data: number[];
  color: string;
}

export const telemetryChartLegend = ['Heart rate', 'Power', 'Cadence', 'Speed (km/h)'];

export const telemetryChartBaseOption: EChartsOption = {
  animation: false,
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#111827',
    textStyle: { color: '#fff' },
    axisPointer: {
      type: 'line',
      lineStyle: { color: '#94a3b8', width: 1 },
      snap: true
    }
  },
  grid: {
    left: 52,
    right: 18,
    top: 18,
    bottom: 36,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisLabel: { color: '#6b7280', rotate: 0, fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#6b7280', fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      lineStyle: {
        color: '#e5e7eb',
        type: 'dashed',
        opacity: 0.8
      }
    }
  }
};

export const telemetryChartEmptyOption: EChartsOption = {
  title: { text: 'No telemetry data available', left: 'center' },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: []
};

function formatMinutesToTime(value: number): string {
  const totalSeconds = Math.max(0, Math.round(value * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function roundAxisValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function getAxisStep(title: string): number {
  if (title.toLowerCase().includes('power')) {
    return 30;
  }

  if (title.toLowerCase().includes('cadence')) {
    return 10;
  }

  if (title.toLowerCase().includes('speed')) {
    return 5;
  }

  return 10;
}

function smoothTelemetryData(data: number[], windowSize = 5): number[] {
  if (data.length <= windowSize) {
    return data;
  }

  return data.map((_, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const slice = data.slice(start, end);
    const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    return Number.isFinite(average) ? average : 0;
  });
}

export function buildTelemetryMetricChartOption(
  elapsedMinutes: number[],
  title: string,
  data: number[],
  color: string
): EChartsOption {
  const maxMinute = elapsedMinutes.length > 0 ? Math.max(...elapsedMinutes) : 0;
  const smoothedData = smoothTelemetryData(data);
  const numericValues = smoothedData.filter((value) => Number.isFinite(value));
  const minValue = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : 0;
  const axisStep = getAxisStep(title);

  const adjustedMin = title.toLowerCase().includes('heart rate')
    ? Math.min(60, Math.floor((minValue - axisStep * 0.35) / 20) * 20)
    : Math.floor((Math.min(minValue, maxValue) - axisStep * 0.35) / axisStep) * axisStep;
  const adjustedMax = title.toLowerCase().includes('heart rate')
    ? Math.max(140, Math.ceil((maxValue + axisStep * 0.35) / 20) * 20)
    : Math.ceil((Math.max(maxValue, minValue) + axisStep * 0.35) / axisStep) * axisStep;

  const yMin = adjustedMin;
  const yMax = adjustedMax;
  const showXAxisLabels = title === 'Cadence (rpm)';

  return {
    ...telemetryChartBaseOption,
    title: { show: false },
    legend: { show: false },
    xAxis: {
      type: 'value',
      min: 0,
      max: maxMinute,
      axisLabel: {
        formatter: (value: number) => showXAxisLabels ? formatMinutesToTime(value) : '',
        color: '#6b7280',
        rotate: 0,
        fontSize: 11
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      splitNumber: 4,
      axisLabel: {
        formatter: (value: number) => String(roundAxisValue(value)),
        color: '#6b7280',
        fontSize: 11
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed',
          opacity: 0.8
        }
      },
      z: 1,
      silent: true,
      triggerEvent: false,
      offset: 0
    },
    series: [{
      name: title,
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbol: 'none',
      emphasis: {
        focus: 'series',
        lineStyle: { width: 3 }
      },
      data: elapsedMinutes.map((minute, index) => [minute, smoothedData[index] ?? 0]),
      lineStyle: { width: 2, color },
      itemStyle: { color },
      areaStyle: {
        color: color,
        opacity: 0.08
      }
    }],
    axisPointer: {
      link: [{ xAxisIndex: 'all' }],
      triggerTooltip: true
    }
  };
}

export function buildTelemetryChartOption(labels: string[], seriesList: TelemetrySeriesConfig[]): EChartsOption {
  return {
    ...telemetryChartBaseOption,
    title: {
      text: 'Telemetry overview',
      left: 'center',
      textStyle: { color: '#0f172a', fontSize: 16 }
    },
    legend: {
      top: 30,
      data: telemetryChartLegend,
      textStyle: { color: '#334155' }
    },
    xAxis: {
      ...(telemetryChartBaseOption.xAxis as Record<string, unknown>),
      data: labels
    },
    series: seriesList.map((series) => ({
      name: series.name,
      type: 'line',
      smooth: true,
      data: series.data,
      lineStyle: { width: 2 },
      itemStyle: { color: series.color }
    }))
  };
}
