import { Injectable } from '@angular/core';

export interface AppConfig {
  apiGatewayUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig = {
    apiGatewayUrl: ''
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
    // If explicitly configured with a non-localhost remote URL, use it
    if (this.config.apiGatewayUrl && !this.config.apiGatewayUrl.includes('localhost')) {
      return this.config.apiGatewayUrl.replace(/\/+$/, '');
    }

    // In browser on Render: default to the Render API gateway
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.includes('onrender.com')) {
        return 'https://bench-api-gateway.onrender.com';
      }
    }

    return (this.config.apiGatewayUrl || 'http://localhost:8082').replace(/\/+$/, '');
  }
}
