import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PropertyMode, PropertyStatus, PropertyType } from '../property.schema';

export class CreatePropertyDto {
  @IsString() title!: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) price!: number;
  @IsString() location!: string;
  @IsString() @IsOptional() city?: string;
  @IsEnum(PropertyType) type!: PropertyType;
  @IsEnum(PropertyMode) mode!: PropertyMode;
  @IsNumber() @IsOptional() bedrooms?: number;
  @IsNumber() @IsOptional() bathrooms?: number;
  @IsNumber() @IsOptional() area?: number;
  @IsNumber() @IsOptional() @Min(0) yearBuilt?: number;
  @IsNumber() @IsOptional() @Min(0) garage?: number;
  @IsArray() @IsString({ each: true }) @IsOptional() features?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() images?: string[];
  @IsEnum(PropertyStatus) @IsOptional() status?: PropertyStatus;
}
