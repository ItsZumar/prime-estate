'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser, logout, saveAuth, AuthUser } from '@/lib/auth';
import { propertyService } from '@/lib/propertyService';
import type { Property, PropertyType, PropertyMode } from '@/lib/properties';
import { useSaved } from '@/lib/saved';
import PropertyCard from '@/components/PropertyCard';
import AppHeader from '@/components/AppHeader';

type Tab = 'listings' | 'saved' | 'profile';

// ── Post Property Modal ────────────────────────────────────────────────────────

type PostForm = {
  title: string; price: string; type: PropertyType; mode: PropertyMode;
  location: string; city: string; bedrooms: string; bathrooms: string;
  area: string; description: string;
};

const EMPTY_FORM: PostForm = {
  title: '', price: '', type: 'house', mode: 'sale',
  location: '', city: '', bedrooms: '', bathrooms: '', area: '', description: '',
};

const MAX_IMAGES = 5;

function PostPropertyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Property) => void }) {
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof PostForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const addImage = () => {
    const url = imageInput.trim();
    if (!url || images.length >= MAX_IMAGES) return;
    if (!url.startsWith('http')) { setError('Image URL must start with http'); return; }
    if (images.includes(url)) return;
    setImages(prev => [...prev, url]);
    setImageInput('');
    setError('');
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.price || !form.location.trim()) {
      setError('Title, price, and location are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await propertyService.create({
        title: form.title.trim(),
        price: Number(form.price),
        type: form.type,
        mode: form.mode,
        location: form.location.trim(),
        city: form.city.trim() || undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        area: form.area ? Number(form.area) : undefined,
        description: form.description.trim() || undefined,
        images,
        status: 'pending',
      });
      onCreated(created);
      onClose();
    } catch {
      setError('Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Post a Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Modern 3BR House in Downtown"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={set('type')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing For</label>
              <select value={form.mode} onChange={set('mode')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD) <span className="text-red-500">*</span></label>
            <input value={form.price} onChange={set('price')} type="number" min="0" placeholder="e.g. 450000"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location <span className="text-red-500">*</span></label>
              <input value={form.location} onChange={set('location')} placeholder="e.g. 5th Ave, NY"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input value={form.city} onChange={set('city')} placeholder="e.g. New York"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Beds</label>
              <input value={form.bedrooms} onChange={set('bedrooms')} type="number" min="0" placeholder="3"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Baths</label>
              <input value={form.bathrooms} onChange={set('bathrooms')} type="number" min="0" placeholder="2"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Area (sqft)</label>
              <input value={form.area} onChange={set('area')} type="number" min="0" placeholder="1800"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              placeholder="Describe the property..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Images <span className="text-gray-400 font-normal">({images.length}/{MAX_IMAGES})</span>
            </label>
            <div className="flex gap-2">
              <input
                value={imageInput}
                onChange={e => setImageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                placeholder="Paste image URL (https://…)"
                disabled={images.length >= MAX_IMAGES}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="button"
                onClick={addImage}
                disabled={images.length >= MAX_IMAGES || !imageInput.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100">
                    <img src={url} alt={`image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-md">Cover</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">Your listing will be submitted for admin review before going live.</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors">
            {submitting ? 'Submitting…' : 'Submit Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-gray-100 text-gray-500',
};

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── My Listings tab ────────────────────────────────────────────────────────────

function MyListingsTab({ listings, onDelete, onAdd }: { listings: Property[]; onDelete: (id: string) => void; onAdd: () => void }) {

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">
          My Listings <span className="text-gray-400 font-normal">({listings.length})</span>
        </h2>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <svg className="w-14 h-14 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-1">No listings yet</p>
          <p className="text-sm text-gray-400 mb-5">Start by posting your first property</p>
          <button onClick={onAdd} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Post a Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(p => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {/* Image */}
              <div className="h-44 relative" style={{ background: `linear-gradient(135deg, ${p.color}22, ${p.color}55)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-14 h-14 opacity-25" style={{ color: p.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M9 22V12h6v10" />
                  </svg>
                </div>
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLE[p.status]}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate mb-0.5">{p.title}</h3>
                <p className="text-blue-600 font-bold text-lg mb-1">
                  ${p.price.toLocaleString()}{p.mode === 'rent' ? '/mo' : ''}
                </p>
                <p className="text-gray-400 text-xs mb-4 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {p.location}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                  <Link href={`/listings/${p.id}`}
                    className="flex-1 py-2 text-xs font-semibold text-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                    View
                  </Link>
                  <button className="flex-1 py-2 text-xs font-semibold text-center border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    onClick={() => onDelete(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Saved Properties tab ───────────────────────────────────────────────────────

function SavedTab({ allProperties, savedIds, onRemove }: { allProperties: Property[]; savedIds: string[]; onRemove: (id: string) => void }) {
  const saved = allProperties.filter(p => savedIds.includes(p.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">
          Saved Properties <span className="text-gray-400 font-normal">({saved.length})</span>
        </h2>
        <Link href="/listings" className="text-sm text-blue-600 hover:underline font-medium">
          Browse more →
        </Link>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <svg className="w-14 h-14 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-1">No saved properties</p>
          <p className="text-sm text-gray-400 mb-5">Heart a listing to save it here</p>
          <Link href="/listings" className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {saved.map(p => (
            <PropertyCard key={p.id} property={p} onRemove={() => onRemove(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile tab ────────────────────────────────────────────────────────────────

function ProfileTab({ user, onUpdate }: { user: AuthUser; onUpdate: (name: string) => void }) {
  const [info, setInfo] = useState({ name: user.name, email: user.email, phone: '' });
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [infoSaved, setInfoSaved] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const saveInfo = () => {
    onUpdate(info.name);
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 2500);
  };

  const savePwd = () => {
    if (pwd.next !== pwd.confirm) return;
    setPwdSaved(true);
    setPwd({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwdSaved(false), 2500);
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{user.name}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
          <button className="mt-2 text-xs text-blue-600 hover:underline font-medium">Change photo</button>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Personal Information</h3>
        <form onSubmit={e => { e.preventDefault(); saveInfo(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input value={info.name} onChange={e => setInfo(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input value={info.email} onChange={e => setInfo(p => ({ ...p, email: e.target.value }))}
              type="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input value={info.phone} onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))}
              type="tel" placeholder="Optional"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit"
            className={`w-full py-3 font-semibold rounded-xl text-sm transition-all ${
              infoSaved
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
            {infoSaved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Change Password</h3>
        <form onSubmit={e => { e.preventDefault(); savePwd(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                type={showCurrent ? 'text' : 'password'} required placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowCurrent(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
                type={showNew ? 'text' : 'password'} required placeholder="Min. 6 characters"
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
              type="password" required placeholder="••••••••"
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                pwd.confirm && pwd.confirm !== pwd.next ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`} />
            {pwd.confirm && pwd.confirm !== pwd.next && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <button type="submit" disabled={!!(pwd.confirm && pwd.confirm !== pwd.next)}
            className={`w-full py-3 font-semibold rounded-xl text-sm transition-all ${
              pwdSaved
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white'
            }`}>
            {pwdSaved ? '✓ Password Updated!' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-400 mb-4">Once you delete your account, all data is permanently removed.</p>
        <button className="px-4 py-2 border border-red-300 text-red-500 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>('listings');
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const { savedIds, remove: removeSaved } = useSaved();

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/auth'); return; }
    if (u.role === 'admin') { router.replace('/admin'); return; }
    setUser(u);
    propertyService.getMine().then(setMyListings).catch(() => {});
    propertyService.getAll().then(setAllProperties).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => { logout(); router.replace('/auth'); };

  const handleDeleteListing = async (id: string) => {
    await propertyService.remove(id);
    setMyListings(ps => ps.filter(p => p.id !== id));
  };

  const updateName = (name: string) => {
    if (!user) return;
    const updated = { ...user, name };
    saveAuth(localStorage.getItem('pe_token')!, updated);
    setUser(updated);
  };

  if (!user) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'listings',
      label: 'My Listings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      <AppHeader user={user} onLogout={handleLogout} />

      {/* Profile hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
              <p className="text-xs text-gray-300 mt-1">Member since January 2024</p>
            </div>
            <div className="hidden sm:flex items-center gap-8 pr-4">
              <StatCard value={myListings.length} label="Listings" />
              <div className="w-px h-8 bg-gray-100" />
              <StatCard value={savedIds.length} label="Saved" />
              <div className="w-px h-8 bg-gray-100" />
              <StatCard value="4.9★" label="Rating" />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-8 border-b border-gray-100">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <span className={tab === t.id ? 'text-blue-600' : 'text-gray-400'}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === 'listings' && <MyListingsTab listings={myListings} onDelete={handleDeleteListing} onAdd={() => setShowPostModal(true)} />}
        {tab === 'saved' && <SavedTab allProperties={allProperties} savedIds={savedIds} onRemove={removeSaved} />}
        {tab === 'profile' && <ProfileTab user={user} onUpdate={updateName} />}
      </main>

      {showPostModal && (
        <PostPropertyModal
          onClose={() => setShowPostModal(false)}
          onCreated={p => setMyListings(prev => [p, ...prev])}
        />
      )}

    </div>
  );
}
