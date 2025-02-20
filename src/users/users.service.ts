import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './users.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    /**
     * ✅ Find user by email and ensure validatePassword() exists
     */
    async findByEmail(email: string): Promise<UserDocument | null> {
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            return null;
        }

        console.log(`🔍 Fetched user from DB:`, user);

        // ✅ Only check for `validatePassword` if it's a local account
        if (user.provider === 'local' && typeof user.validatePassword !== 'function') {
            console.error(`❌ Error: validatePassword is not available on user object!`);
        }

        return user as UserDocument;
    }



    /**
     * ✅ Find user by ID
     */

    async findById(userId: string): Promise<UserDocument> {
        console.log('🔍 Searching for user with ID:', userId);

        // Convert string ID to MongoDB ObjectId
        const objectId = new Types.ObjectId(userId);
        const user = await this.userModel.findById(objectId).exec();

        console.log('🔍 Found user:', user);

        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user as UserDocument;
    }

    /**
     * ✅ Get all users (Admin only)
     */
    async findAll(): Promise<UserDocument[]> {
        return this.userModel.find().exec() as Promise<UserDocument[]>;
    }

    /**
     * ✅ Create a new user with a hashed password
     */
    async createUser(email: string, password: string | null = null, provider: string = 'local'): Promise<UserDocument> {
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new BadRequestException(`User already exists with ${existingUser.provider}. Please log in with ${existingUser.provider}.`);
        }

        console.log(`🔍 Creating new user with provider: ${provider}`);

        // ✅ Only hash password for local users, else set it as null
        const hashedPassword = provider === 'local' && password ? await bcrypt.hash(password, 10) : null;

        const newUser = new this.userModel({
            _id: new Types.ObjectId(),
            email,
            password: hashedPassword, // ✅ Supports `null`
            role: 'user',
            emailVerified: provider !== 'local',
            provider
        });

        console.log(`✅ Final User Data Before Saving: ${JSON.stringify(newUser)}`);

        return newUser.save() as Promise<UserDocument>;
    }







    /**
     * ✅ Update user profile or credentials
     */
    async updateUser(userId: string, updateData: Partial<User>): Promise<UserDocument> {
        // Convert string ID to MongoDB ObjectId
        const objectId = new Types.ObjectId(userId);

        const updatedUser = await this.userModel.findByIdAndUpdate(
            objectId,
            updateData,
            { new: true }
        ).exec();

        if (!updatedUser) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return updatedUser as UserDocument;
    }

    /**
     * ✅ Update user password and ensure it is saved correctly
     */
    async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        const user = await this.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.password = hashedPassword;
        user.markModified('password'); // ✅ Ensure Mongoose recognizes the update
        await user.save();
    }

    /**
     * ✅ Verify user email
     */
    async verifyEmail(userId: string): Promise<void> {
        const user = await this.findById(userId);
        user.emailVerified = true;
        await user.save();
    }

    /**
     * ✅ Delete user by ID
     */
    async deleteUser(userId: string): Promise<void> {
        const deletedUser = await this.userModel.findByIdAndDelete(userId).exec();
        if (!deletedUser) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }
    }
}
