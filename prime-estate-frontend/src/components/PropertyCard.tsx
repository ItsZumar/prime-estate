'use client';

import Link from 'next/link';
import type { Property } from '@/lib/properties';

type Props = {
  property: Property;
  onRemove?: () => void;
};

export default function PropertyCard({ property: p, onRemove }: Props) {
  const hasImage = p.images && p.images.length > 0;
  const imageArea = (
    <div className="h-48 relative shrink-0 overflow-hidden"
      style={!hasImage ? { background: `linear-gradient(135deg, ${p.color}22, ${p.color}55)` } : {}}>
      {hasImage ? (
        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-16 h-16 opacity-25" style={{ color: p.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M9 22V12h6v10" />
          </svg>
        </div>
      )}

      {onRemove ? (
        <>
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 text-xs font-bold text-white rounded-full ${p.mode === 'rent' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              For {p.mode === 'rent' ? 'Rent' : 'Sale'}
            </span>
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 text-xs font-medium bg-white/80 backdrop-blur-sm text-gray-700 rounded-full capitalize">
              {p.type}
            </span>
          </div>
          <button
            onClick={onRemove}
            title="Remove from saved"
            className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </>
      ) : (
        <>
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-white text-xs font-semibold text-gray-700 rounded-full shadow-sm capitalize">{p.type}</span>
          </div>
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-xs font-bold text-white rounded-full ${p.mode === 'rent' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              For {p.mode === 'rent' ? 'Rent' : 'Sale'}
            </span>
          </div>
        </>
      )}
    </div>
  );

  const body = (
    <div className={`p-4 ${onRemove ? 'flex flex-col flex-1' : ''}`}>
      <h3 className="font-semibold text-gray-900 truncate mb-1">{p.title}</h3>
      <p className="text-xl font-bold text-blue-600 mb-2">
        ${p.price.toLocaleString()}
        {p.mode === 'rent' && <span className="text-sm font-medium text-gray-400">/mo</span>}
      </p>
      <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="truncate">{p.location}</span>
      </div>
      <div className={`flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-50 ${onRemove ? 'mb-4' : ''}`}>
        {p.bedrooms > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {p.bedrooms} beds
          </span>
        )}
        {p.bathrooms > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {p.bathrooms} baths
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          {p.area.toLocaleString()} ft²
        </span>
      </div>

      {onRemove && (
        <div className="flex items-center gap-2 mt-auto">
          <Link
            href={`/listings/${p.id}`}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center rounded-xl transition-colors"
          >
            View Details
          </Link>
          <button
            onClick={onRemove}
            title="Remove from saved"
            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  if (onRemove) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
        {imageArea}
        {body}
      </div>
    );
  }

  return (
    <Link href={`/listings/${p.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 block">
      {imageArea}
      {body}
    </Link>
  );
}
