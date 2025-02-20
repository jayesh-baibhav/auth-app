import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    /**
     * ✅ Validate user credentials (Handles OAuth)
     */
    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // ✅ If the user is an OAuth user (Google/Facebook), skip password validation
        if (user.provider !== 'local') {
            console.log(`✅ OAuth user detected (${user.provider}), skipping password validation.`);
            return user;
        }

        // ✅ Validate password for 'local' users only
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return user;
    }

    async validateOAuthLogin(email: string, provider: string) {
        let user = await this.usersService.findByEmail(email);

        if (user) {
            // ✅ Ensure user is logging in with the correct provider
            if (user.provider !== provider) {
                throw new BadRequestException(
                    `User already exists with ${user.provider}. Please log in with ${user.provider}.`
                );
            }

            console.log(`✅ User found with ${provider} login`);
            return user;
        }

        console.log(`🔍 No existing user found. Creating new user with ${provider}`);

        // ✅ Explicitly pass `null` as password for Google/Facebook users
        return await this.usersService.createUser(email, null, provider);
    }






    /**
     * ✅ User Login (Handles OAuth users)
     */
    async login(user: any) {
        if (!user.provider) {
            console.log(`⚠️ User has no provider field! Defaulting to 'local'.`);
            user.provider = 'local';
        }

        console.log(`🔐 Generating JWT for ${user.email} (${user.provider})`);

        const payload = {
            email: user.email,
            sub: user._id.toString(),
            role: user.role,
            provider: user.provider
        };

        return { jwt: this.jwtService.sign(payload) };
    }

    /**
     * ✅ User Registration (Prevents duplicate OAuth accounts)
     */
    async register(email: string, password: string) {
        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            if (existingUser.provider !== 'local') {
                throw new BadRequestException(`User already exists with ${existingUser.provider}. Please use ${existingUser.provider} to sign in.`);
            }
            throw new BadRequestException('User already exists');
        }

        console.log(`🔍 Registering new user with email/password`);

        // Hash password for local auth users
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await this.usersService.createUser(email, 'local', hashedPassword);

        console.log(`✅ User successfully registered: ${newUser.email}`);

        return {
            message: "User registered successfully",
            userId: newUser._id.toString(),
            email: newUser.email
        };
    }



    /**
     * ✅ Forgot Password (Prevents OAuth users from resetting passwords)
     */
    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 🚨 Prevent password reset for Google/Facebook users
        if (user.provider !== 'local') {
            throw new BadRequestException(`Cannot reset password for ${user.provider} login. Use ${user.provider} to sign in.`);
        }

        const token = this.jwtService.sign({ email: user.email }, { expiresIn: '15m' });

        console.log(`Password reset link: http://localhost:5000/auth/reset-password?token=${token}`);
    }

    /**
     * ✅ Reset Password (Prevents OAuth users from resetting passwords)
     */
    async resetPassword(token: string, newPassword: string) {
        let payload;
        try {
            payload = this.jwtService.verify(token);
            console.log('Token payload:', payload);

            const user = await this.usersService.findByEmail(payload.email);
            if (!user) {
                throw new NotFoundException('User not found');
            }

            // 🚨 Prevent password reset for Google/Facebook users
            if (user.provider !== 'local') {
                throw new BadRequestException(`Cannot reset password for ${user.provider} login. Use ${user.provider} to sign in.`);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            console.log('Password hashed successfully');

            const userId = user._id instanceof Types.ObjectId ? user._id.toString() : user._id;

            const updatedUser = await this.usersService.updateUser(userId, { password: hashedPassword });
            console.log('User updated successfully');

            return updatedUser;
        } catch (error) {
            console.log('Reset password error:', error.message);
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('Invalid token');
            }
            throw error;
        }
    }

    /**
     * ✅ Verify Email Using Token
     */
    async verifyEmail(token: string) {
        let payload;
        try {
            payload = this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const user = await this.usersService.findByEmail(payload.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.usersService.updateUser(user._id.toString(), { emailVerified: true });
    }
    async generateToken(user: any) {
        const payload = {
            email: user.email,
            sub: user._id.toString(),
            role: user.role,
            provider: user.provider
        };
        return this.jwtService.sign(payload);
    }

}
