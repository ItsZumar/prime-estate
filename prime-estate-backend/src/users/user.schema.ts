import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret['id'] = String(ret['_id']);
      delete ret['_id'];
      delete ret['__v'];
      delete ret['password'];
    },
  },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, unique: true, lowercase: true }) email!: string;
  @Prop({ required: true }) password!: string;
  @Prop({ type: String, enum: UserRole, default: UserRole.USER }) role!: UserRole;
  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE }) status!: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
