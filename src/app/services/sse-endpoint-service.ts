import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { SsePostService } from './sse-post-service';

@Injectable({
  providedIn: 'root'
})
export class SseEndpointService {

    private configService = inject(ConfigService);

    get urlRoot(): string {
        return this.configService.apiGatewayUrl + '/';
    }


    private readonly URL_RAW_GARMIN_FILE = 'garmin-file/raw-data';

    constructor(private ssePostService: SsePostService) {}

    public saveRawFile(body: FormData = new FormData()): Observable<any> {
      return this.ssePostService.connectPost(this.urlRoot + this.URL_RAW_GARMIN_FILE, body);
    }

}