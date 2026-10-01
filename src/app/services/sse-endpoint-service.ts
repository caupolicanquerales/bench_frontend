import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { SsePostService } from './sse-post-service';
import { SseGetService } from './sse-get-service';

@Injectable({
  providedIn: 'root'
})
export class SseEndpointService {

    private configService = inject(ConfigService);

    get urlRoot(): string {
        return this.configService.apiGatewayUrl + '/';
    }


    private readonly URL_RAW_GARMIN_FILE = 'garmin-file/raw-data';
    private readonly URL_SUMMARY_DATA = 'garmin-data/data-summary';
    private readonly URL_CHART_DATA = 'garmin-data/data-charts';
    private readonly URL_GPS_DATA = 'garmin-data/data-gps';

    constructor(private ssePostService: SsePostService,
      private sseGetService: SseGetService) {}

    saveRawFile(body: FormData = new FormData()): Observable<any> {
      return this.ssePostService.connectPost(this.urlRoot + this.URL_RAW_GARMIN_FILE, body);
    }

    getSummaryData(): Observable<any> {
      return this.sseGetService.connectGet(this.urlRoot + this.URL_SUMMARY_DATA);
    }

    getChartsData(): Observable<any> {
      return this.sseGetService.connectGet(this.urlRoot + this.URL_CHART_DATA);
    }

    getGpsData(): Observable<any> {
      return this.sseGetService.connectGet(this.urlRoot + this.URL_GPS_DATA);
    }

}