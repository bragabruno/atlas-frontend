import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConfigService } from '../../core/services/config.service';

export interface UsageRow {
  app: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_cost_usd: string;
}

export interface UsageResponse {
  since: string;
  rows: UsageRow[];
}

@Injectable({ providedIn: 'root' })
export class UsageService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  getUsage(since?: string): Observable<UsageResponse> {
    const params: Record<string, string> = since ? { since } : {};
    return this.http.get<UsageResponse>(`${this.config.gatewayUrl}/v1/usage`, { params });
  }
}
