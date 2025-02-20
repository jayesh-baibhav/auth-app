import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        const clientID = configService.getOrThrow<string>('FACEBOOK_CLIENT_ID');
        const clientSecret = configService.getOrThrow<string>('FACEBOOK_CLIENT_SECRET');
        const callbackURL = configService.getOrThrow<string>('FACEBOOK_CALLBACK_URL');

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'public_profile'],
            profileFields: ['emails', 'name'],
            passReqToCallback: false
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void,
    ): Promise<any> {
        const { emails } = profile;
        const email = emails?.[0]?.value;

        if (!email) {
            throw new UnauthorizedException('Facebook profile must include an email');
        }

        const user = await this.usersService.findByEmail(email);

        if (user) {
            return done(null, user);
        }

        const newUser = await this.usersService.createUser(email, 'facebook-auth');
        newUser.emailVerified = true;
        await newUser.save();

        return done(null, newUser);
    }
}
