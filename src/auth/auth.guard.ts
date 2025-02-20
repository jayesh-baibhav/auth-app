import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,  // ✅ Ensure JwtService is properly injected
        private reflector: Reflector,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const token = request.cookies?.jwt; // ✅ Extract JWT from cookies

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
            console.log('🔍 Decoded JWT payload:', decoded);
            request.user = decoded;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
