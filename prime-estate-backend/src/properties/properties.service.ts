import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument, PropertyStatus, PropertyType } from './property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(@InjectModel(Property.name) private model: Model<PropertyDocument>) {}

  findAll(type?: PropertyType) {
    const filter: Record<string, unknown> = { status: PropertyStatus.ACTIVE };
    if (type) filter.type = type;
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  findAllAdmin() {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  findOne(id: string) {
    return this.model.findById(id).exec();
  }

  findByOwner(ownerId: string) {
    return this.model.find({ owner: ownerId }).sort({ createdAt: -1 }).exec();
  }

  create(dto: CreatePropertyDto, ownerId: string) {
    return this.model.create({ ...dto, owner: ownerId });
  }

  update(id: string, dto: Partial<CreatePropertyDto>) {
    return this.model.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  remove(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  removeOwned(id: string, ownerId: string) {
    return this.model.findOneAndDelete({ _id: id, owner: ownerId }).exec();
  }

  count() {
    return this.model.countDocuments().exec();
  }

  countActive() {
    return this.model.countDocuments({ status: PropertyStatus.ACTIVE }).exec();
  }
}
