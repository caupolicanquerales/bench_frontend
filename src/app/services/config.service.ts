import { Injectable } from '@angular/core';

export interface AppConfig {
  apiGatewayUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig = {
    apiGatewayUrl: 'http://localhost:8082'
  };

  async loadConfig(): Promise<void> {
    try {
      const response = await fetch('/app-config.json');
      if (response.ok) {
        const data = await response.json();
        this.config = { ...this.config, ...data };
      }
    } catch {
      // Fallback to default localhost config if fetch fails
    }
  }

  get apiGatewayUrl(): string {
    return this.config.apiGatewayUrl.replace(/\/+$/, '');
  }
}
