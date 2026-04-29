import { api } from './api';
import { authHeaders } from './auth';
import { getPropertyColor } from './properties';
import type { Property, PropertyMode, PropertyStatus, PropertyType } from './properties';

type ApiProperty = {
  id: string;
  title: string;
  description?: string;
  price: number;
  location: string;
  city?: string;
  type: string;
  mode: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt?: number;
  garage?: number;
  features?: string[];
  images?: string[];
  status: string;
  createdAt: string;
};

export type CreatePropertyPayload = {
  title: string;
  description?: string;
  price: number;
  location: string;
  city?: string;
  type: PropertyType;
  mode: PropertyMode;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  yearBuilt?: number;
  garage?: number;
  features?: string[];
  images?: string[];
  status?: PropertyStatus;
};

function adapt(p: ApiProperty): Property {
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? '',
    price: p.price,
    location: p.location,
    city: p.city ?? '',
    type: p.type as PropertyType,
    mode: p.mode as PropertyMode,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    yearBuilt: p.yearBuilt ?? 0,
    garage: p.garage ?? 0,
    features: p.features ?? [],
    images: p.images ?? [],
    status: p.status as PropertyStatus,
    createdAt: p.createdAt,
    color: getPropertyColor(p.type),
  };
}

export const propertyService = {
  getAll: () =>
    api.get<ApiProperty[]>('/properties').then(ps => ps.map(adapt)),

  getOne: (id: string) =>
    api.get<ApiProperty>(`/properties/${id}`).then(adapt),

  getMine: () =>
    api.get<ApiProperty[]>('/properties/mine', { headers: authHeaders() }).then(ps => ps.map(adapt)),

  getAllAdmin: () =>
    api.get<ApiProperty[]>('/properties/all', { headers: authHeaders() }).then(ps => ps.map(adapt)),

  create: (payload: CreatePropertyPayload) =>
    api.post<ApiProperty>('/properties', payload, { headers: authHeaders() }).then(adapt),

  update: (id: string, payload: Partial<CreatePropertyPayload> & { status?: PropertyStatus }) =>
    api.patch<ApiProperty>(`/properties/${id}`, payload, { headers: authHeaders() }).then(adapt),

  remove: (id: string) =>
    api.delete<void>(`/properties/${id}`, { headers: authHeaders() }),
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
};

export const userService = {
  getAll: () =>
    api.get<AdminUser[]>('/users', { headers: authHeaders() }),

  updateStatus: (id: string, status: AdminUser['status']) =>
    api.patch<AdminUser>(`/users/${id}/status`, { status }, { headers: authHeaders() }),
};

export type SiteSettings = {
  siteName: string;
  contactEmail: string;
  maxListingsPerUser: number;
  currency: string;
  allowRegistration: boolean;
  requireApproval: boolean;
  maintenanceMode: boolean;
};

export const settingsService = {
  get: () => api.get<SiteSettings>('/settings'),
  update: (payload: Partial<SiteSettings>) =>
    api.patch<SiteSettings>('/settings', payload, { headers: authHeaders() }),
};
