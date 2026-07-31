import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

const MOCK_PREFIX = 'Bearer mock:';

/**
 * Wraps JwtAuthGuard with an opt-in local-dev bypass for `Authorization: Bearer mock:<sub>`.
 * Only takes effect when AUTH_MOCK_ENABLED=true, so it cannot be accidentally
 * live in an environment where that flag isn't explicitly set. Real bearer
 * tokens always go through the unmodified Auth0 JWKS verification path.
 */
@Injectable()
export class HybridAuthGuard implements CanActivate {
  private readonly logger = new Logger(HybridAuthGuard.name);
  private readonly mockEnabled: boolean;

  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    config: ConfigService,
  ) {
    this.mockEnabled = config.get<string>('AUTH_MOCK_ENABLED') === 'true';
    if (this.mockEnabled) {
      this.logger.warn(
        'AUTH_MOCK_ENABLED=true — accepting "Bearer mock:<sub>" tokens with NO signature verification. Never set this in production.',
      );
    }
  }

  canActivate(context: ExecutionContext) {
    if (this.mockEnabled) {
      const req = context.switchToHttp().getRequest();
      const authHeader: string | undefined = req.headers.authorization;
      if (authHeader?.startsWith(MOCK_PREFIX)) {
        const sub = authHeader.slice(MOCK_PREFIX.length).trim();
        if (!sub) {
          throw new UnauthorizedException();
        }
        req.user = { sub, ownerId: sub };
        return true;
      }
    }
    return this.jwtAuthGuard.canActivate(context);
  }
}
