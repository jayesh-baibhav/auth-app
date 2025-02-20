import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FastifyReply } from 'fastify';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const response: FastifyReply = context.switchToHttp().getResponse();

        // Add missing methods to the response object
        (response as any).setHeader = (name: string, value: string) => {
            response.header(name, value);
        };

        (response as any).end = () => {
            response.send();
        };

        // Call the parent `canActivate` method to proceed with the authentication
        const result = (await super.canActivate(context)) as boolean;

        // Log in the user
        await super.logIn(request);

        return result;
    }
}
