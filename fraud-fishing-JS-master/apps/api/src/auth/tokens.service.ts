// tokens.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_super_admin: boolean;
};
export type AccessPayload = { sub: string; type: 'access'; profile: UserProfile };
export type RefreshPayload = { sub: string; type: 'refresh' };

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async generateAccess(profile: UserProfile): Promise<string> {
    return this.jwtService.signAsync(
      { sub: profile.id, type: 'access', profile },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '10m'),
      },
    );
  }

  async generateRefresh(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '1d'),
      },
    );
  }

  async verifyAccess(token: string): Promise<AccessPayload> {
    const payload = await this.jwtService.verifyAsync<AccessPayload>(token, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
    if (payload.type !== 'access') throw new Error('Invalid token type');
    return payload;
  }

  async verifyRefresh(token: string): Promise<RefreshPayload> {
    const payload = await this.jwtService.verifyAsync<RefreshPayload>(token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
    if (payload.type !== 'refresh') throw new Error('Invalid token type');
    return payload;
  }
}
