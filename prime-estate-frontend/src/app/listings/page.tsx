'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { propertyService } from '@/lib/propertyService';
import type { Property } from '@/lib/properties';
import PropertyCard from '@/components/PropertyCard';
import AppHeader from '@/components/AppHeader';
import type { AuthUser } from '@/lib/auth';

type FilterState = {
  search: string;
  mode: 'all' | 'sale' | 'rent';
  types: string[];
  priceMin: string;
  priceMax: string;
  bedroomsMin: number;
};

type SortOption = 'latest' | 'price_asc' | 'price_desc';

const DEFAULT_FILTERS: FilterState = {
  search: '', mode: 'all', types: [], priceMin: '', priceMax: '', bedroomsMin: 0,
};

const PROP_TYPES = ['house', 'apartment', 'villa', 'land'];
const BEDROOM_OPTS = [0, 1, 2, 3, 4];

type FilterPanelProps = {
  filters: FilterState;
  onChange: (f: FilterState) => void;
};

function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const toggleType = (type: string) =>
    set({ types: filters.types.includes(type) ? filters.types.filter(t => t !== type) : [...filters.types, type] });

  const hasActive = filters.search || filters.mode !== 'all' || filters.types.length > 0 || filters.priceMin || filters.priceMax || filters.bedroomsMin > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        {hasActive && (
          <button onClick={() => onChange(DEFAULT_FILTERS)} className="text-xs text-blue-600 hover:underline">Reset all</button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Keyword</label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={filters.search} onChange={e => set({ search: e.target.value })}
            placeholder="City, address, title…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
      </div>

      {/* Listing type */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Listing Type</label>
        <div className="flex gap-1.5">
          {(['all', 'sale', 'rent'] as const).map(m => (
            <button key={m} onClick={() => set({ mode: m })}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${
                filters.mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {m === 'all' ? 'All' : m === 'sale' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Property Type</label>
        <div className="grid grid-cols-2 gap-2">
          {PROP_TYPES.map(type => (
            <button key={type} onClick={() => toggleType(type)}
              className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                filters.types.includes(type)
                  ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Price Range</label>
        <div className="flex items-center gap-2">
          <input value={filters.priceMin} onChange={e => set({ priceMin: e.target.value })}
            placeholder="Min $" type="number" min={0}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0" />
          <span className="text-gray-300 text-lg">—</span>
          <input value={filters.priceMax} onChange={e => set({ priceMax: e.target.value })}
            placeholder="Max $" type="number" min={0}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0" />
        </div>
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[['<$200K', '', '200000'], ['$200K–$500K', '200000', '500000'], ['$500K+', '500000', '']].map(([label, min, max]) => (
            <button key={label} onClick={() => set({ priceMin: min, priceMax: max })}
              className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 text-xs rounded-lg transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Bedrooms</label>
        <div className="flex gap-1.5">
          {BEDROOM_OPTS.map(n => (
            <button key={n} onClick={() => set({ bedroomsMin: n })}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                filters.bedroomsMin === n ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {n === 0 ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main listings content ──────────────────────────────────────────────────────

function ListingsContent() {

  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>('latest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setUser(getUser());
    propertyService.getAll().then(setAllProperties).catch(() => {});
    const q = searchParams.get('q') ?? '';
    const type = searchParams.get('type') ?? '';
    const mode = searchParams.get('mode') ?? '';
    setFilters({
      ...DEFAULT_FILTERS,
      search: q,
      types: type && type !== 'All' ? [type.toLowerCase()] : [],
      mode: mode === 'Rent' ? 'rent' : mode === 'Buy' ? 'sale' : 'all',
    });
  }, [searchParams]);

  const results = useMemo(() => {
    let list = [...allProperties];
    const q = filters.search.toLowerCase();
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.city.toLowerCase().includes(q));
    if (filters.mode !== 'all') list = list.filter(p => p.mode === filters.mode);
    if (filters.types.length > 0) list = list.filter(p => filters.types.includes(p.type));
    if (filters.priceMin) list = list.filter(p => p.price >= Number(filters.priceMin));
    if (filters.priceMax) list = list.filter(p => p.price <= Number(filters.priceMax));
    if (filters.bedroomsMin > 0) list = list.filter(p => p.bedrooms >= filters.bedroomsMin);
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [allProperties, filters, sort]);

  const hasActive = filters.search || filters.mode !== 'all' || filters.types.length > 0 || filters.priceMin || filters.priceMax || filters.bedroomsMin > 0;

  return (
    <div className="min-h-screen bg-gray-50">

      <AppHeader
        user={user}
        onLogout={() => { logout(); setUser(null); }}
        search={filters.search}
        onSearchChange={v => setFilters(p => ({ ...p, search: v }))}
        extraActions={
          <button
            onClick={() => setShowMobileFilters(p => !p)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {hasActive && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
          </button>
        }
      />

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="md:hidden bg-white border-b border-gray-200 p-5">
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium">Listings</span>
        </nav>

        <div className="flex gap-8">
          {/* Sidebar — desktop only */}
          <aside className="hidden md:block w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <FilterPanel filters={filters} onChange={setFilters} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {results.length} {results.length === 1 ? 'Property' : 'Properties'}
                </h1>
                {filters.search && (
                  <p className="text-sm text-gray-400 mt-0.5">for &ldquo;{filters.search}&rdquo;</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 hidden sm:block">Sort:</label>
                <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
                  className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="latest">Latest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {hasActive && (
              <div className="flex flex-wrap gap-2 mb-5">
                {filters.search && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    &ldquo;{filters.search}&rdquo;
                    <button onClick={() => setFilters(p => ({ ...p, search: '' }))} className="ml-1 hover:text-blue-900">✕</button>
                  </span>
                )}
                {filters.mode !== 'all' && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full capitalize">
                    {filters.mode === 'sale' ? 'Buy' : 'Rent'}
                    <button onClick={() => setFilters(p => ({ ...p, mode: 'all' }))} className="ml-1 hover:text-blue-900">✕</button>
                  </span>
                )}
                {filters.types.map(t => (
                  <span key={t} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full capitalize">
                    {t}
                    <button onClick={() => setFilters(p => ({ ...p, types: p.types.filter(x => x !== t) }))} className="ml-1 hover:text-blue-900">✕</button>
                  </span>
                ))}
                {(filters.priceMin || filters.priceMax) && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {filters.priceMin ? `$${Number(filters.priceMin).toLocaleString()}` : '$0'} – {filters.priceMax ? `$${Number(filters.priceMax).toLocaleString()}` : '∞'}
                    <button onClick={() => setFilters(p => ({ ...p, priceMin: '', priceMax: '' }))} className="ml-1 hover:text-blue-900">✕</button>
                  </span>
                )}
                {filters.bedroomsMin > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {filters.bedroomsMin}+ beds
                    <button onClick={() => setFilters(p => ({ ...p, bedroomsMin: 0 }))} className="ml-1 hover:text-blue-900">✕</button>
                  </span>
                )}
              </div>
            )}

            {results.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <svg className="w-14 h-14 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-semibold text-gray-700 mb-1">No properties found</p>
                <p className="text-sm text-gray-400 mb-5">Try adjusting or clearing your filters</p>
                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.map(p => <PropertyCard key={p.id} property={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading listings…</div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
