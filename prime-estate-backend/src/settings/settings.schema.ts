import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = SiteSettings & Document;

@Schema({ timestamps: true })
export class SiteSettings {
  @Prop({ default: 'Prime Estate' }) siteName!: string;
  @Prop({ default: 'hello@primeestate.com' }) contactEmail!: string;
  @Prop({ default: 10 }) maxListingsPerUser!: number;
  @Prop({ default: 'USD' }) currency!: string;
  @Prop({ default: true }) allowRegistration!: boolean;
  @Prop({ default: true }) requireApproval!: boolean;
  @Prop({ default: false }) maintenanceMode!: boolean;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
