import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

    private summaryData = new BehaviorSubject<boolean>(false);
    summaryData$: Observable<boolean> = this.summaryData.asObservable();

    private chartsData = new BehaviorSubject<boolean>(false);
    chartsData$: Observable<boolean> = this.chartsData.asObservable();

    private gpsData = new BehaviorSubject<boolean>(false);
    gpsData$: Observable<boolean> = this.gpsData.asObservable();

    setSummaryData(summaryData:boolean): void{
        this.summaryData.next(summaryData);
    }

    setChartsData(chartsData:boolean): void{
        this.chartsData.next(chartsData);
    }

    setGpsData(gpsData:boolean): void{
        this.gpsData.next(gpsData);
    }
}