import { Request, Response } from 'express';
import { Controller, Get, Post, UseGuards, Body, Param, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { FastifyReply } from 'fastify';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: { email: string; password: string }) {
        await this.authService.register(registerDto.email, registerDto.password);
        return { message: 'User registered successfully' };
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Req() req: Request, @Res() res: FastifyReply) {
        const { jwt } = await this.authService.login(req.user);
        res.setCookie('jwt', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        res.status(200).send({ message: 'Login successful' });
    }

    @Post('logout')
    async logout(@Res() res: FastifyReply) {
        res.clearCookie('jwt', { path: '/' });
        res.status(200).send({ message: 'Logout successful' });
    }

    @Post('forgot-password')
    async forgotPassword(@Body() forgotDto: { email: string }) {
        await this.authService.forgotPassword(forgotDto.email);
        return { message: 'Password reset link sent to email' };
    }

    @Post('reset-password')
    async resetPassword(@Body() resetDto: { token: string; newPassword: string }) {
        await this.authService.resetPassword(resetDto.token, resetDto.newPassword);
        return { message: 'Password has been reset successfully' };
    }

    @Get('verify-email/:token')
    async verifyEmail(@Param('token') token: string) {
        await this.authService.verifyEmail(token);
        return { message: 'Email verified successfully' };
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth(@Res() res: FastifyReply) {
        res.status(200);
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Req() req: Request, @Res() res: FastifyReply) {
        const { jwt } = await this.authService.login(req.user);
        res.setCookie('jwt', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        }).redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }


    @Get('facebook')
    @UseGuards(FacebookAuthGuard)
    async facebookAuth() { }

    @Get('facebook/callback')
    @UseGuards(FacebookAuthGuard)
    async facebookAuthCallback(@Req() req: Request, @Res() res: FastifyReply) {
        const { jwt } = await this.authService.login(req.user);
        res.setCookie('jwt', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        res.status(200).send({
            message: 'Facebook auth successful',
            user: req.user,
        });
    }
}