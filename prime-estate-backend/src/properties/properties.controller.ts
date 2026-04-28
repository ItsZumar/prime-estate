import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PropertyType, PropertyStatus } from './property.schema';
import { SettingsService } from '../settings/settings.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private propertiesService: PropertiesService,
    private settingsService: SettingsService,
  ) {}

  @Get()
  findAll(@Query('type') type?: PropertyType) {
    return this.propertiesService.findAll(type);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAllAdmin() {
    return this.propertiesService.findAllAdmin();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: { user: { userId: string } }) {
    return this.propertiesService.findByOwner(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreatePropertyDto, @Request() req: { user: { userId: string; role: string } }) {
    if (req.user.role !== 'admin') {
      const requireApproval = await this.settingsService.getRequireApproval();
      dto.status = requireApproval ? PropertyStatus.PENDING : PropertyStatus.ACTIVE;
    }
    return this.propertiesService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePropertyDto>) {
    return this.propertiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: { userId: string; role: string } }) {
    if (req.user.role === 'admin') return this.propertiesService.remove(id);
    return this.propertiesService.removeOwned(id, req.user.userId);
  }
}
