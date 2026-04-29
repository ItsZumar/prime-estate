'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout } from '@/lib/auth';
import { propertyService } from '@/lib/propertyService';
import type { Property } from '@/lib/properties';
import { useSaved } from '@/lib/saved';
import AppHeader from '@/components/AppHeader';
import type { AuthUser } from '@/lib/auth';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggle } = useSaved();

  useEffect(() => {
    setUser(getUser());
    Promise.all([
      propertyService.getOne(id),
      propertyService.getAll(),
    ]).then(([prop, all]) => {
      setProperty(prop);
      setSimilar(all.filter(p => p.id !== prop.id && p.type === prop.type).slice(0, 3));
    }).catch(() => {
      setProperty(null);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLogout = () => { logout(); router.replace('/auth'); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm animate-pulse">Loading property…</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p className="text-xl font-semibold text-gray-700 mb-2">Property not found</p>
          <Link href="/listings" className="text-sm text-blue-600 hover:underline">← Back to listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <AppHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/listings" className="hover:text-blue-600 transition-colors">Listings</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium truncate max-w-48">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Image gallery */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 h-72 rounded-2xl overflow-hidden relative"
                style={!property.images[0] ? { background: `linear-gradient(135deg, ${property.color}33, ${property.color}77)` } : {}}>
                {property.images[0] ? (
                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-28 h-28 opacity-15" style={{ color: property.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 22V12h6v10" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold text-white rounded-full ${property.mode === 'rent' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                    For {property.mode === 'rent' ? 'Rent' : 'Sale'}
                  </span>
                  <span className="px-2.5 py-1 bg-white text-xs font-semibold text-gray-700 rounded-full capitalize">{property.type}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[1, 2].map((idx) => (
                  <div key={idx} className="flex-1 rounded-2xl overflow-hidden relative"
                    style={!property.images[idx] ? { background: `linear-gradient(${135 + idx * 40}deg, ${property.color}22, ${property.color}44)` } : {}}>
                    {property.images[idx] ? (
                      <img src={property.images[idx]} alt={`${property.title} ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 opacity-20" style={{ color: property.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Title & key info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{property.title}</h1>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {property.location}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    ${property.price.toLocaleString()}{property.mode === 'rent' ? '/mo' : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{property.mode === 'rent' ? 'Monthly rent' : 'Listing price'}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-gray-100 mb-5">
                {[
                  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Bedrooms', value: property.bedrooms || '—' },
                  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Bathrooms', value: property.bathrooms || '—' },
                  { icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4', label: 'Area', value: `${property.area.toLocaleString()} ft²` },
                  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Year Built', value: property.yearBuilt },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <svg className="w-5 h-5 mx-auto mb-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                    </svg>
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <h2 className="font-semibold text-gray-900 mb-2">About this property</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{property.description}</p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">Features &amp; Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.features.map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Contact card (sticky) ── */}
          <div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24 space-y-5">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  ${property.price.toLocaleString()}{property.mode === 'rent' ? '/mo' : ''}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">{property.mode === 'rent' ? 'Monthly rent' : 'Listing price'}</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  JD
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">John Davis</p>
                  <p className="text-xs text-gray-400">Licensed Agent · ⭐ 4.9</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Link href="/auth"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm text-center block">
                  Contact Agent
                </Link>
                <Link href="/auth"
                  className="w-full py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl transition-colors text-sm text-center block">
                  Schedule a Tour
                </Link>
                <button
                  onClick={() => property && toggle(property.id)}
                  className={`w-full py-3 font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 ${
                    property && isSaved(property.id)
                      ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill={property && isSaved(property.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {property && isSaved(property.id) ? 'Saved' : 'Save Property'}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Property ID</span>
                  <span className="font-medium text-gray-600">#PE-{property.id.padStart(4, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="font-medium text-gray-600 capitalize">{property.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Garage</span>
                  <span className="font-medium text-gray-600">{property.garage ? `${property.garage} car` : 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar properties */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Similar Properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {similar.map(p => (
                <Link key={p.id} href={`/listings/${p.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="h-40 relative overflow-hidden" style={!p.images[0] ? { background: `linear-gradient(135deg, ${p.color}22, ${p.color}55)` } : {}}>
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 opacity-20" style={{ color: p.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${p.mode === 'rent' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                        For {p.mode === 'rent' ? 'Rent' : 'Sale'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.title}</p>
                    <p className="text-blue-600 font-bold mt-0.5 text-sm">${p.price.toLocaleString()}{p.mode === 'rent' ? '/mo' : ''}</p>
                    <p className="text-xs text-gray-400 mt-1">{p.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
