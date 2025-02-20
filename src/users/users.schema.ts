import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema, Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';

export interface UserDocument extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    roles: Role[];
    emailVerified: boolean;
    provider: string;
    thirdPartyId: string;
    profile: {
        name: string;
        picture: string;
    };
    validatePassword(password: string): Promise<boolean>;
}

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
    password: any;

    @Prop({ type: [String], default: [Role.USER] })
    roles: Role[];

    @Prop({ default: false })
    emailVerified: boolean;

    @Prop({ type: String, enum: ['local', 'google', 'facebook'], default: 'local' })
    provider: string;

    @Prop({ type: String })
    thirdPartyId: string;

    @Prop({
        type: {
            name: String,
            picture: String
        },
        required: false
    })
    profile: {
        name: string;
        picture: string;
    };
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password)
        return next();
    if (this.provider === 'local') {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

UserSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
    if (!this.password) {
        console.log(`❌ Skipping password validation. User is registered via ${this.provider}.`);
        return false;
    }
    const trimmedPassword = password.trim();
    const isMatch = await bcrypt.compare(trimmedPassword, this.password);
    return isMatch;
};
