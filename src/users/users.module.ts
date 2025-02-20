import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './users.schema';
import { JwtModule } from '@nestjs/jwt';  // ✅ Import JwtModule

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        JwtModule.register({  // ✅ Register JwtModule inside UsersModule
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService], // ✅ Export UsersService
})
export class UsersModule { }
