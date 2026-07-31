import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

interface JwtPayload {
  sub: string;
  [key: string]: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const issuerUrl = config.getOrThrow<string>('AUTH0_ISSUER_URL');
    const issuer = issuerUrl.endsWith('/') ? issuerUrl : `${issuerUrl}/`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: config.getOrThrow<string>('AUTH0_AUDIENCE'),
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new Error('Token missing sub claim');
    }
    return { sub: payload.sub, ownerId: payload.sub };
  }
}
