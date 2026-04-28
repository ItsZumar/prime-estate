import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PropertyDocument = HydratedDocument<Property>;

export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  VILLA = 'villa',
  LAND = 'land',
}

export enum PropertyMode {
  SALE = 'sale',
  RENT = 'rent',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
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
    },
  },
  toObject: { virtuals: true },
})
export class Property {
  @Prop({ required: true }) title!: string;
  @Prop() description!: string;
  @Prop({ required: true }) price!: number;
  @Prop({ required: true }) location!: string;
  @Prop() city!: string;
  @Prop({ type: String, enum: PropertyType, required: true }) type!: PropertyType;
  @Prop({ type: String, enum: PropertyMode, required: true }) mode!: PropertyMode;
  @Prop({ default: 0 }) bedrooms!: number;
  @Prop({ default: 0 }) bathrooms!: number;
  @Prop({ default: 0 }) area!: number;
  @Prop({ default: 0 }) yearBuilt!: number;
  @Prop({ default: 0 }) garage!: number;
  @Prop([String]) features!: string[];
  @Prop([String]) images!: string[];
  @Prop({ type: String, enum: PropertyStatus, default: PropertyStatus.ACTIVE }) status!: PropertyStatus;
  @Prop({ type: Types.ObjectId, ref: 'User' }) owner!: Types.ObjectId;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
