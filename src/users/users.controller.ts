import { Controller, Get, Param, Delete, UseGuards, Req, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard)
    @Get('me')  // Make sure there are no extra spaces or newlines
    async getOwnProfile(@Req() req) {
        console.log('🔍 Extracted User from JWT:', req.user);
        const userId = req.user.sub;
        console.log('🔍 Using userId:', userId);
        return this.usersService.findById(userId);
    }


    // Update own profile
    @UseGuards(AuthGuard)
    @Put('me')
    async updateOwnProfile(@Req() req, @Body() updateData) {
        return this.usersService.updateUser(req.user.sub, updateData);
    }

    // Get all users (Admin only)
    @UseGuards(AuthGuard)
    @Get()
    async getAllUsers() {
        return this.usersService.findAll();
    }

    // Get user by ID
    @UseGuards(AuthGuard)
    @Get(':id')
    async getUserById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    // Delete own account
    @UseGuards(AuthGuard)
    @Delete('me')
    async deleteOwnAccount(@Req() req) {
        await this.usersService.deleteUser(req.user.userId);
        return { message: 'User deleted successfully' };
    }

    // Delete user (Admin only)
    @UseGuards(AuthGuard)
    @Delete(':id')
    async deleteUserById(@Param('id') id: string) {
        await this.usersService.deleteUser(id);
        return { message: 'User deleted successfully' };
    }
}
