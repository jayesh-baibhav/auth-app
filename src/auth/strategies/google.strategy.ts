import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    console.log('Google Profile:', profile);
    const { emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      console.error('No email found in Google profile');
      throw new UnauthorizedException('Google profile must include an email');
    }

    console.log('User email:', email);
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      console.log('Creating new user with email:', email);
      user = await this.usersService.createUser(email, null, 'google');
      user.emailVerified = true;
      await user.save();
    }

    return user;
  }
}

