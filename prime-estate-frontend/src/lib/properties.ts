export type PropertyType = 'house' | 'apartment' | 'villa' | 'land';
export type PropertyMode = 'sale' | 'rent';
export type PropertyStatus = 'active' | 'sold' | 'pending';

export type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  type: PropertyType;
  mode: PropertyMode;
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt: number;
  garage: number;
  features: string[];
  images: string[];
  status: PropertyStatus;
  createdAt: string;
  color: string; // computed client-side from type
};

const TYPE_COLORS: Record<string, string> = {
  house: '#f59e0b',
  apartment: '#10b981',
  villa: '#3b82f6',
  land: '#8b5cf6',
};

export function getPropertyColor(type: string): string {
  return TYPE_COLORS[type] ?? '#6b7280';
}
