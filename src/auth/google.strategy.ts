import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'your-google-client-id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'your-google-client-secret',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:5000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Call the authService to handle login / registration logic
      const user = await this.authService.validateOAuthLogin(profile.id, 'google', profile);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}