import { Component } from '@angular/core';
import { GeneralService } from '../services/general.service';
import { SseEndpointService } from '../services/sse-endpoint-service';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  imports: [],
  selector: 'app-telemetry-chart',
  standalone: true,
  styleUrl: './app-telemetry-chart.scss',
  templateUrl: './app-telemetry-chart.html',
})
export class AppTelemetryChart {

  subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();

  constructor(private generalService: GeneralService,
        private sseEndpointService: SseEndpointService) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngOnInit(): void {
      this.generalService.chartsData$.pipe(takeUntil(this.destroy$)).subscribe((chartsData) => this.setSubscriptionToChartsData(chartsData));
  }

  private setSubscriptionToChartsData(chartsData: boolean): void{
    if(chartsData){
      this.subscriptions.add(
        this.sseEndpointService.getChartsData().subscribe({
          next: (response) => {
            console.log('Charts Data received:', response);
          },
          error: (err) =>{
            console.log('Charts Data error:', err);
          },
        })
      );
    }
  }
}
