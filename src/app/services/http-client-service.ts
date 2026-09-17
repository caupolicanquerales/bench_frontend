import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {

    private configService = inject(ConfigService);

    get urlRoot(): string {
        return this.configService.apiGatewayUrl + '/';
    }

    constructor(private http: HttpClient) {}

}
