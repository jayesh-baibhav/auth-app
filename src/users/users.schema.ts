import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';

export type UserDocument = User & Document & {
    validatePassword: (password: string) => Promise<boolean>;
};

@Schema({ timestamps: true })
export class User {
    @Prop({ type: Types.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({
        type: MongooseSchema.Types.Mixed,
        required: false,
        default: null
    })
    password: string | null;

    @Prop({ type: [String], default: [Role.USER] })
    roles: Role[];

    @Prop({ default: false })
    emailVerified: boolean;

    @Prop({ type: String, enum: ['local', 'google', 'facebook'], default: 'local' })
    provider: string;
}

export const UserSchema = SchemaFactory.createForClass(User);


// ✅ Hash password before saving
UserSchema.pre<UserDocument>('save', async function (next) {
    // Skip if password not modified or is null (OAuth case)
    if (!this.isModified('password') || !this.password) return next();

    // Only hash password for local auth users
    if (this.provider === 'local') {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});


// ✅ Attach validatePassword method to schema
UserSchema.methods.validatePassword = async function (password: string) {
    console.log(`🔍 Received password for comparison (raw input): '${password}'`);
    console.log(`🔍 Stored hashed password in DB: '${this.password}'`);
    console.log(`🔍 Provider: '${this.provider}'`);

    // ✅ If the user signed up with Google/Facebook, they don’t have a password
    if (!this.password) {
        console.log(`❌ Skipping password validation. User is registered via ${this.provider}.`);
        return false;
    }

    // ✅ Trim any extra spaces (for safety)
    const trimmedPassword = password.trim();

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(trimmedPassword, this.password);
    console.log(`✅ Password comparison result:`, isMatch);

    return isMatch;
};


