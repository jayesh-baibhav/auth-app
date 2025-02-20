import {
    Controller,
    Post,
    Get,
    Request,
    UseGuards,
    Response,
    Body,
    Param,
    Req,
    Res
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { FastifyReply } from 'fastify';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }


    /**
     * ✅ Register a new user
     */
    @Post('register')
    async register(@Body() registerDto: { email: string; password: string }) {
        await this.authService.register(registerDto.email, registerDto.password);
        return { message: 'User registered successfully' };
    }

    /**
     * ✅ Login user and set JWT cookie
     */
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req, @Response() res: FastifyReply) {
        const { jwt } = await this.authService.login(req.user);

        // ✅ Use `setCookie()` for Fastify
        res.setCookie('jwt', jwt, {
            httpOnly: true,
            secure: false, // Set to `true` in production
            sameSite: 'strict',
            path: '/',
        });

        return res.send({ message: 'Login successful' });
    }

    /**
     * ✅ Logout user (Clear JWT cookie)
     */
    @Post('logout')
    async logout(@Response() res: FastifyReply) {
        res.clearCookie('jwt', { path: '/' });
        return res.send({ message: 'Logout successful' });
    }

    /**
     * ✅ Forgot password (Send password reset link)
     */
    @Post('forgot-password')
    async forgotPassword(@Body() forgotDto: { email: string }) {
        await this.authService.forgotPassword(forgotDto.email);
        return { message: 'Password reset link sent to email' };
    }

    /**
     * ✅ Reset password using token
     */
    @Post('reset-password')
    async resetPassword(@Body() resetDto: { token: string; newPassword: string }) {
        await this.authService.resetPassword(resetDto.token, resetDto.newPassword);
        return { message: 'Password has been reset successfully' };
    }

    /**
     * ✅ Verify email using token
     */
    @Get('verify-email/:token')
    async verifyEmail(@Param('token') token: string) {
        await this.authService.verifyEmail(token);
        return { message: 'Email verified successfully' };
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Guard will handle the redirect
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req, @Res() res: FastifyReply) {
        const token = await this.authService.generateToken(req.user);
        res.setCookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
        return res.redirect('/dashboard');
    }


    @Get('facebook')
    @UseGuards(FacebookAuthGuard)
    async facebookAuth(@Res() res: FastifyReply) {
        return res.send({ msg: 'Facebook Authentication' });
    }

    @Get('facebook/callback')
    @UseGuards(FacebookAuthGuard)
    async facebookAuthCallback(@Req() req, @Res() res: FastifyReply) {
        const { jwt } = await this.authService.login(req.user);

        res.setCookie('jwt', jwt, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            path: '/',
        });

        return res.send({
            message: 'Facebook auth successful',
            user: req.user
        });
    }

}