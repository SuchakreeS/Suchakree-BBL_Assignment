import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Test-only stand-in for JwtAuthGuard: trusts `Authorization: Bearer <sub>`
 * directly instead of verifying against Auth0's JWKS, so e2e tests can
 * simulate distinct authenticated users without minting real signed JWTs.
 */
@Injectable()
export class FakeAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const sub = authHeader.slice('Bearer '.length).trim();
    if (!sub) {
      throw new UnauthorizedException();
    }
    req.user = { sub, ownerId: sub };
    return true;
  }
}
