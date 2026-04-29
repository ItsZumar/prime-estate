'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser, logout, AuthUser } from '@/lib/auth';
import { propertyService } from '@/lib/propertyService';
import type { Property } from '@/lib/properties';
import { useSaved } from '@/lib/saved';
import PropertyCard from '@/components/PropertyCard';
import AppHeader from '@/components/AppHeader';

type SortKey = 'saved' | 'price_asc' | 'price_desc';
type ModeFilter = 'all' | 'sale' | 'rent';

// ── Undo toast ─────────────────────────────────────────────────────────────────

function UndoToast({ name, onUndo, onDismiss }: { name: string; onUndo: () => void; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl animate-slide-up">
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span className="text-sm"><span className="font-medium">{name}</span> removed from saved</span>
      <button onClick={onUndo} className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors ml-1">
        Undo
      </button>
      <button onClick={onDismiss} className="ml-1 text-gray-500 hover:text-gray-300 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}


// ── Page ───────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const { savedIds, remove, restore } = useSaved();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [sort, setSort] = useState<SortKey>('saved');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/auth'); return; }
    setUser(u);
    propertyService.getAll().then(setAllProperties).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = (id: string, name: string) => {
    remove(id);
    setUndo({ id, name });
  };

  const handleUndo = () => {
    if (!undo) return;
    restore(undo.id);
    setUndo(null);
  };

  const savedProperties = useMemo(() => {
    let list = allProperties.filter(p => savedIds.includes(p.id));

    if (modeFilter !== 'all') list = list.filter(p => p.mode === modeFilter);

    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    else list = [...list].sort((a, b) => savedIds.indexOf(a.id) - savedIds.indexOf(b.id));

    return list;
  }, [allProperties, savedIds, sort, modeFilter]);

  const totalSaved = allProperties.filter(p => savedIds.includes(p.id)).length;

  const handleLogout = () => { logout(); router.replace('/auth'); };

  return (
    <div className="min-h-screen bg-gray-50">

      <AppHeader user={user} onLogout={handleLogout} />

      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">{totalSaved}</span>
              </div>
              <p className="text-sm text-gray-400 ml-0 sm:ml-13">Properties you&apos;ve hearted — all in one place</p>
            </div>
            <Link
              href="/listings"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Browse more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode filter pills */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-0.5">
            {(['all', 'sale', 'rent'] as ModeFilter[]).map(m => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  modeFilter === m ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'all' ? 'All' : m === 'sale' ? 'For Sale' : 'For Rent'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">Sort by</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="saved">Newest Saved</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {savedProperties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">
              {modeFilter !== 'all' ? 'No saved properties match this filter' : 'No saved properties yet'}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {modeFilter !== 'all'
                ? 'Try switching to "All" or heart some more listings'
                : 'Heart a listing while browsing to save it here'}
            </p>
            {modeFilter !== 'all' ? (
              <button
                onClick={() => setModeFilter('all')}
                className="px-5 py-2.5 border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Clear filter
              </button>
            ) : (
              <Link
                href="/listings"
                className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Browse Properties
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">
              Showing {savedProperties.length} of {totalSaved} saved
              {modeFilter !== 'all' && ` · filtered by "${modeFilter === 'sale' ? 'For Sale' : 'For Rent'}"`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {savedProperties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onRemove={() => handleRemove(p.id, p.title)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Undo toast */}
      {undo && (
        <UndoToast
          name={undo.name}
          onUndo={handleUndo}
          onDismiss={() => setUndo(null)}
        />
      )}

    </div>
  );
}
