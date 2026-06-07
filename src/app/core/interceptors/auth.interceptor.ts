import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { ConfigService } from '../services/config.service';

/**
 * Functional HTTP interceptor that attaches `Authorization: Bearer <token>` to
 * every outgoing request whose URL is prefixed by the runtime gateway URL.
 *
 * The token is read from ConfigService at request time — it is never hardcoded
 * in the bundle.  The gateway URL is also sourced from runtime config so there
 * are no secrets or environment-specific strings baked into the build.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(ConfigService);

  // Only attach auth to gateway requests; skip config.json fetch and other URLs.
  const cfg = config.config();
  if (!cfg || !req.url.startsWith(cfg.gatewayUrl)) {
    return next(req);
  }

  const token = cfg.bearerToken;
  if (!token) {
    return next(req);
  }

  const authedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authedReq);
};
