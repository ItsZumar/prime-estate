import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  create(data: { name: string; email: string; password: string; role?: UserRole }) {
    return this.model.create(data);
  }

  findAll() {
    return this.model.find().select('-password').exec();
  }

  updateStatus(id: string, status: UserStatus) {
    return this.model.findByIdAndUpdate(id, { status }, { new: true }).select('-password').exec();
  }

  count() {
    return this.model.countDocuments().exec();
  }
}
