import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteSettings, SettingsDocument } from './settings.schema';

export class SettingsDto {
  siteName?: string;
  contactEmail?: string;
  maxListingsPerUser?: number;
  currency?: string;
  allowRegistration?: boolean;
  requireApproval?: boolean;
  maintenanceMode?: boolean;
}

@Injectable()
export class SettingsService {
  constructor(@InjectModel(SiteSettings.name) private model: Model<SettingsDocument>) {}

  async get(): Promise<SiteSettings> {
    let doc = await this.model.findOne().exec();
    if (!doc) doc = await this.model.create({});
    return doc;
  }

  async update(dto: SettingsDto): Promise<SiteSettings> {
    const doc = await this.model.findOneAndUpdate({}, { $set: dto }, { new: true, upsert: true }).exec();
    return doc!;
  }

  async getRequireApproval(): Promise<boolean> {
    const settings = await this.get();
    return settings.requireApproval;
  }
}
