import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Shape of /config.json — resolved at runtime, never committed. */
export interface RuntimeConfig {
  /** Base URL of the atlas-gateway (e.g. https://gateway.internal). */
  gatewayUrl: string;
  /**
   * Bearer token used to authenticate requests to the gateway.
   * Sourced from a secured runtime config endpoint or BFF — never hardcoded.
   */
  bearerToken?: string;
  /**
   * Default gateway model/alias for chat. Lets each environment pick a model
   * its gateway actually serves (e.g. `mock` for the offline dev loop,
   * `atlas-rag` in real envs) without rebuilding the bundle.
   */
  defaultModel?: string;
}

/**
 * ConfigService loads runtime configuration from /config.json on app
 * initialisation.  No API keys or tokens are ever embedded in the bundle.
 *
 * The file lives at the served root: `public/config.json` is copied to the
 * build-output root by the Angular `public` asset glob, and the local compose
 * loop mounts `frontend-config.json` over `/usr/share/nginx/html/config.json`
 * to override `gatewayUrl` at deploy time without rebuilding the image.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly _config = signal<RuntimeConfig | null>(null);

  /** Resolved runtime config, or null before initialisation completes. */
  readonly config = this._config.asReadonly();

  /** Call once via APP_INITIALIZER to load config before the app renders. */
  async load(): Promise<void> {
    const cfg = await firstValueFrom(
      this.http.get<RuntimeConfig>('/config.json'),
    );
    this._config.set(cfg);
  }

  /** Convenience getter — throws if called before load() resolves. */
  get gatewayUrl(): string {
    const cfg = this._config();
    if (!cfg) {
      throw new Error('ConfigService.load() has not completed yet.');
    }
    return cfg.gatewayUrl;
  }
}
