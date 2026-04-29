'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, AuthUser } from '@/lib/auth';
import { propertyService } from '@/lib/propertyService';
import type { Property } from '@/lib/properties';
import PropertyCard from '@/components/PropertyCard';
import AppHeader from '@/components/AppHeader';

const TYPES = ['All', 'House', 'Apartment', 'Villa', 'Land'] as const;

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/auth'); return; }
    setUser(u);
    propertyService.getAll().then(setProperties).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = properties.filter(p => {
    const matchesType = activeFilter === 'All' || p.type === activeFilter.toLowerCase();
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleLogout = () => { logout(); router.replace('/auth'); };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} onLogout={handleLogout} search={search} onSearchChange={setSearch} />

      {/* Hero */}
      <section className="bg-linear-to-br from-blue-900 to-blue-700 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Find Your Dream Property</h1>
          <p className="text-blue-200 text-lg mb-8">Explore thousands of premium listings across the country</p>
          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="City, address, or ZIP…"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {TYPES.map(type => (
            <button key={type} onClick={() => setActiveFilter(type)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {type}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 whitespace-nowrap shrink-0">
            {filtered.length} properties
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <svg className="w-14 h-14 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">No properties found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
