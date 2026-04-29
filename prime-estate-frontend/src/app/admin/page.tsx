'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, AuthUser } from '@/lib/auth';
import { propertyService, userService } from '@/lib/propertyService';
import type { AdminUser as ApiAdminUser } from '@/lib/propertyService';
import { Property, PropertyType, PropertyMode } from '@/lib/properties';
import { settingsService, type SiteSettings } from '@/lib/propertyService';

// ── Types ───────────────────────────────────────────────────────────────────────

type AdminProperty = Property;
type AdminUser = ApiAdminUser;
type NavId = 'dashboard' | 'properties' | 'users' | 'settings';

const NAV: { id: NavId; label: string }[] = [
  { id: 'dashboard',  label: 'Dashboard'  },
  { id: 'properties', label: 'Properties' },
  { id: 'users',      label: 'Users'      },
  { id: 'settings',   label: 'Settings'   },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

function fmtPrice(p: number) { return '$' + p.toLocaleString(); }

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-yellow-100  text-yellow-700',
  sold:      'bg-gray-100    text-gray-500',
  suspended: 'bg-red-100     text-red-600',
};

// ── Nav icon ────────────────────────────────────────────────────────────────────

function NavIcon({ id }: { id: string }) {
  const cls = 'w-5 h-5';
  if (id === 'dashboard') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
  if (id === 'properties') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  );
  if (id === 'users') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ── Property modal (Add / Edit) ──────────────────────────────────────────────────

type PropForm = {
  title: string; price: string; type: PropertyType; mode: PropertyMode;
  location: string; city: string; bedrooms: string; bathrooms: string;
  area: string; yearBuilt: string; garage: string; description: string;
  status: 'active' | 'pending' | 'sold';
  images: string[];
};

const EMPTY_FORM: PropForm = {
  title: '', price: '', type: 'house', mode: 'sale',
  location: '', city: '', bedrooms: '', bathrooms: '',
  area: '', yearBuilt: '', garage: '', description: '', status: 'active',
  images: [],
};

function propToForm(p: AdminProperty): PropForm {
  return {
    title: p.title, price: String(p.price), type: p.type, mode: p.mode,
    location: p.location, city: p.city, bedrooms: String(p.bedrooms),
    bathrooms: String(p.bathrooms), area: String(p.area),
    yearBuilt: String(p.yearBuilt), garage: String(p.garage),
    description: p.description, status: p.status,
    images: p.images ?? [],
  };
}

const MAX_PROP_IMAGES = 5;

function PropertyModal({
  editing, onSave, onClose,
}: {
  editing: AdminProperty | null;
  onSave: (form: PropForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PropForm>(editing ? propToForm(editing) : EMPTY_FORM);
  const [imageInput, setImageInput] = useState('');
  const set = (k: keyof PropForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const addImage = () => {
    const url = imageInput.trim();
    if (!url || form.images.length >= MAX_PROP_IMAGES || !url.startsWith('http')) return;
    if (form.images.includes(url)) return;
    setForm(f => ({ ...f, images: [...f.images, url] }));
    setImageInput('');
  };

  const removeImage = (idx: number) =>
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{editing ? 'Edit Property' : 'Add Property'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Modern Villa with Pool"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <input value={form.price} onChange={set('price')} type="number" placeholder="850000"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={set('type')}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode</label>
              <select value={form.mode} onChange={set('mode')}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input value={form.location} onChange={set('location')} placeholder="Beverly Hills, CA"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input value={form.city} onChange={set('city')} placeholder="Beverly Hills"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {([['bedrooms','Beds'],['bathrooms','Baths'],['area','Area ft²'],['yearBuilt','Year'],['garage','Garage']] as [keyof PropForm, string][]).map(([k, lbl]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{lbl}</label>
                <input value={form[k]} onChange={set(k)} type="number"
                  className="w-full px-2.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Describe the property…"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Images <span className="text-gray-400 font-normal">({form.images.length}/{MAX_PROP_IMAGES})</span>
            </label>
            <div className="flex gap-2">
              <input
                value={imageInput}
                onChange={e => setImageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                placeholder="Paste image URL (https://…)"
                disabled={form.images.length >= MAX_PROP_IMAGES}
                className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button type="button" onClick={addImage}
                disabled={form.images.length >= MAX_PROP_IMAGES || !imageInput.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors">
                Add
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100">
                    <img src={url} alt={`image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <button onClick={() => onSave(form)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
            {editing ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── XML Import modal ─────────────────────────────────────────────────────────────

type XmlRow = { title: string; price: string; type: string; mode: string; location: string; city: string; bedrooms: string; bathrooms: string; area: string; images: string };
type RawRecord  = Record<string, string>;
type ImportStep = 'source' | 'preview' | 'mapping' | 'done';
type SourceTab  = 'url' | 'file';

function parseXmlFeed(xml: string): RawRecord[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
  const records: RawRecord[] = [];
  doc.querySelectorAll('property').forEach(node => {
    const record: RawRecord = {};
    Array.from(node.children).forEach(child => {
      if (child.children.length) {
        // collect nested children (e.g. <images><image>url</image>…</images>)
        record[child.tagName] = Array.from(child.children)
          .map(c => c.textContent?.trim() ?? '')
          .filter(Boolean)
          .join('\n');
      } else {
        record[child.tagName] = child.textContent?.trim() ?? '';
      }
    });
    if (Object.keys(record).length) records.push(record);
  });
  return records;
}

function autoSuggest(tags: string[]): Record<string, string> {
  const hints: [string, string[]][] = [
    ['title',     ['title', 'name', 'heading', 'property_name', 'propertyname']],
    ['price',     ['price', 'cost', 'value', 'amount', 'asking']],
    ['type',      ['type', 'kind', 'category', 'property_type', 'propertytype']],
    ['mode',      ['mode', 'listing', 'transaction', 'for', 'sale_type']],
    ['location',  ['location', 'address', 'addr', 'full_address']],
    ['city',      ['city', 'town', 'suburb', 'municipality']],
    ['bedrooms',  ['bedroom', 'bed', 'br', 'num_bed']],
    ['bathrooms', ['bathroom', 'bath', 'num_bath']],
    ['area',      ['area', 'size', 'sqft', 'sq_ft', 'square']],
    ['images',    ['images', 'image', 'photos', 'photo', 'pics', 'gallery', 'media']],
  ];
  const map: Record<string, string> = {};
  for (const [field, words] of hints) {
    const found = tags.find(tag =>
      words.some(w => tag.toLowerCase().includes(w) || w.includes(tag.toLowerCase()))
    );
    if (found) map[field] = found;
  }
  return map;
}

const PROP_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: 'title',     label: 'Title',     required: true  },
  { key: 'price',     label: 'Price',     required: true  },
  { key: 'type',      label: 'Type',      required: false },
  { key: 'mode',      label: 'Mode',      required: false },
  { key: 'location',  label: 'Location',  required: false },
  { key: 'city',      label: 'City',      required: false },
  { key: 'bedrooms',  label: 'Bedrooms',  required: false },
  { key: 'bathrooms', label: 'Bathrooms', required: false },
  { key: 'area',      label: 'Area ft²',  required: false },
  { key: 'images',    label: 'Images',    required: false },
];

const IMPORT_STEPS: { id: ImportStep; label: string }[] = [
  { id: 'source',  label: 'Source'     },
  { id: 'preview', label: 'Preview'    },
  { id: 'mapping', label: 'Map Fields' },
  { id: 'done',    label: 'Import'     },
];

function XmlModal({ onImport, onClose }: { onImport: (rows: XmlRow[]) => void; onClose: () => void }) {
  const [step, setStep]           = useState<ImportStep>('source');
  const [tab, setTab]             = useState<SourceTab>('url');
  const [url, setUrl]             = useState('');
  const [fetching, setFetching]   = useState(false);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(false);
  const [records, setRecords]     = useState<RawRecord[]>([]);
  const [tags, setTags]           = useState<string[]>([]);
  const [fieldMap, setFieldMap]   = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress]   = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const stepIndex = IMPORT_STEPS.findIndex(s => s.id === step);

  const processRecords = (recs: RawRecord[]) => {
    const allTags = Array.from(new Set(recs.flatMap(r => Object.keys(r))));
    setRecords(recs);
    setTags(allTags);
    setFieldMap(autoSuggest(allTags));
    setError('');
    setStep('preview');
  };

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setError('');
    try {
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const recs = parseXmlFeed(text);
      if (!recs.length) throw new Error('No <property> elements found in feed');
      processRecords(recs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch XML');
    } finally {
      setFetching(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xml')) { setError('Please upload a .xml file'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const recs = parseXmlFeed(e.target?.result as string);
        if (!recs.length) { setError('No <property> elements found'); return; }
        processRecords(recs);
      } catch {
        setError('Could not parse XML file');
      }
    };
    reader.readAsText(file);
  };

  const startImport = () => {
    setImporting(true);
    setProgress(0);
    const iv = setInterval(() => setProgress(p => p >= 92 ? p : p + Math.random() * 18), 120);
    setTimeout(() => {
      clearInterval(iv);
      setProgress(100);
      const rows: XmlRow[] = records.map(r => ({
        title:     r[fieldMap.title]     ?? '',
        price:     r[fieldMap.price]     ?? '',
        type:      r[fieldMap.type]      ?? '',
        mode:      r[fieldMap.mode]      ?? '',
        location:  r[fieldMap.location]  ?? '',
        city:      r[fieldMap.city]      ?? '',
        bedrooms:  r[fieldMap.bedrooms]  ?? '',
        bathrooms: r[fieldMap.bathrooms] ?? '',
        area:      r[fieldMap.area]      ?? '',
        images:    r[fieldMap.images]    ?? '',
      }));
      onImport(rows);
      setImporting(false);
      setStep('done');
    }, 1400);
  };

  const goBack = () => {
    const order: ImportStep[] = ['source', 'preview', 'mapping', 'done'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">XML Feed Importer</h2>
              <p className="text-xs text-gray-400">Bulk import properties from any XML feed</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step bar */}
        <div className="flex items-center px-6 py-3 border-b border-gray-100 shrink-0">
          {IMPORT_STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  stepIndex > idx  ? 'bg-blue-600 text-white' :
                  stepIndex === idx ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {stepIndex > idx
                    ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    : idx + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${stepIndex >= idx ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {idx < IMPORT_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-colors ${stepIndex > idx ? 'bg-blue-400' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">

          {/* ── Step 1: Source ── */}
          {step === 'source' && (
            <div className="space-y-5">
              <div className="flex rounded-xl border border-gray-200 p-1 gap-1">
                {(['url', 'file'] as SourceTab[]).map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    {t === 'url' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        XML URL
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Upload File
                      </>
                    )}
                  </button>
                ))}
              </div>

              {tab === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">XML Feed URL</label>
                    <div className="flex gap-2">
                      <input
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !fetching && handleFetchUrl()}
                        placeholder="https://feeds.example.com/properties.xml"
                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleFetchUrl}
                        disabled={fetching || !url.trim()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                        {fetching
                          ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        }
                        {fetching ? 'Fetching…' : 'Fetch'}
                      </button>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 flex gap-3">
                    <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700">The feed must be CORS-enabled or same-origin. For private feeds, use file upload.</p>
                  </div>
                </div>
              )}

              {tab === 'file' && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}>
                  <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600">Drop your XML file here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <input ref={fileRef} type="file" accept=".xml" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                </div>
              )}

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{records.length}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Records found</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{tags.length}</p>
                  <p className="text-xs text-blue-600 mt-0.5">Fields detected</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-700">{Object.keys(fieldMap).length}</p>
                  <p className="text-xs text-purple-600 mt-0.5">Auto-mapped</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Detected fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      Object.values(fieldMap).includes(tag) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>{tag}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sample data (first 3 records)</p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>{tags.map(tag => <th key={tag} className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">{tag}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.slice(0, 3).map((rec, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {tags.map(tag => <td key={tag} className="px-3 py-2 text-gray-600 max-w-28 truncate">{rec[tag] || '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Map Fields ── */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Match your XML fields to Prime Estate property fields. Auto-suggested mappings are pre-filled.</p>
              <div className="space-y-3">
                {PROP_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center gap-4">
                    <div className="w-24 shrink-0 flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-800">{f.label}</span>
                      {f.required && <span className="text-red-400 text-xs">*</span>}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <select
                      value={fieldMap[f.key] ?? ''}
                      onChange={e => setFieldMap(m => ({ ...m, [f.key]: e.target.value }))}
                      className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldMap[f.key] ? 'border-blue-200 bg-blue-50/40 text-gray-800' : 'border-gray-200 text-gray-400'
                      }`}>
                      <option value="">— skip —</option>
                      {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </select>
                    <div className="w-5 shrink-0 flex items-center justify-center">
                      {fieldMap[f.key]
                        ? <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        : <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                      }
                    </div>
                  </div>
                ))}
              </div>
              {!fieldMap.title && !fieldMap.price && (
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-amber-700">Map at least Title and Price for meaningful imports.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 'done' && (
            <div className="py-10 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{records.length} {records.length === 1 ? 'property' : 'properties'} imported</p>
                <p className="text-sm text-gray-500 mt-1">All listings added as <span className="font-medium text-yellow-600">pending</span> — review and approve in the Properties tab.</p>
              </div>
              <button onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                View Properties
              </button>
            </div>
          )}

          {/* Import progress overlay */}
          {importing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-5 rounded-2xl">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <div className="w-56 space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Importing {records.length} {records.length === 1 ? 'property' : 'properties'}…</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'done' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
            <button onClick={goBack}
              className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
              {step === 'source' ? 'Cancel' : 'Back'}
            </button>
            {step !== 'source' && (
              <button
                onClick={() => step === 'preview' ? setStep('mapping') : startImport()}
                disabled={importing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                {step === 'mapping' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import {records.length} {records.length === 1 ? 'Property' : 'Properties'}
                  </>
                ) : 'Continue'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard section ────────────────────────────────────────────────────────────

function DashboardSection({
  properties, users, onImportClick, onNavChange, onApprove, onReject,
}: {
  properties: AdminProperty[];
  users: AdminUser[];
  onImportClick: () => void;
  onNavChange: (id: NavId) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const totalListings = properties.length;
  const activeCount   = properties.filter(p => p.status === 'active').length;
  const pendingCount  = properties.filter(p => p.status === 'pending').length;
  const totalValue    = properties.reduce((s, p) => s + p.price, 0);

  const STATS = [
    {
      label: 'Total Listings', value: totalListings, sub: `${activeCount} active`,
      color: 'blue', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Pending Approvals', value: pendingCount, sub: 'Awaiting review',
      color: 'yellow', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Users', value: users.length, sub: `${users.filter(u => u.status === 'active').length} active`,
      color: 'purple', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Portfolio Value', value: '$' + (totalValue / 1_000_000).toFixed(1) + 'M', sub: 'All listings',
      color: 'emerald', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const colorMap: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-600',
    yellow:  'bg-yellow-50 text-yellow-600',
    purple:  'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  const recentPending = properties.filter(p => p.status === 'pending').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
                {s.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending approvals */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">{pendingCount}</span>
              )}
            </div>
            <button onClick={() => onNavChange('properties')} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          {recentPending.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No pending approvals</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPending.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-9 rounded-xl shrink-0 overflow-hidden" style={{ background: p.color + '22' }}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4" style={{ color: p.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.location} · {fmtPrice(p.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => onApprove(p.id)} className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium rounded-lg transition-colors">Approve</button>
                    <button onClick={() => onReject(p.id)} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium rounded-lg transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XML Import card */}
        <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-1">XML Import</h3>
          <p className="text-orange-100 text-sm mb-5">Bulk import property listings from XML feeds in seconds.</p>
          <ul className="space-y-2 mb-6">
            {['Drag & drop XML file', 'Preview before import', 'Instant bulk upload'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-orange-100">
                <svg className="w-4 h-4 text-orange-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <button onClick={onImportClick}
            className="w-full py-2.5 bg-white text-orange-600 font-semibold text-sm rounded-xl hover:bg-orange-50 transition-colors">
            Import XML Feed
          </button>
        </div>
      </div>

      {/* Recent listings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Listings</h2>
          <button onClick={() => onNavChange('properties')} className="text-xs text-blue-600 hover:underline font-medium">Manage all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.slice(0, 5).map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.location}</p>
                  </td>
                  <td className="px-5 py-3.5 capitalize text-sm text-gray-600">{p.type}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{fmtPrice(p.price)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Properties section ───────────────────────────────────────────────────────────

function PropertiesSection({
  properties, onAdd, onEdit, onDelete, onApprove, onReject, onImportClick,
}: {
  properties: AdminProperty[];
  onAdd: () => void;
  onEdit: (p: AdminProperty) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onImportClick: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => properties.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchType   = filterType   === 'all' || p.type   === filterType;
    return matchSearch && matchStatus && matchType;
  }), [properties, search, filterStatus, filterType]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search properties…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="land">Land</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={onImportClick}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-medium rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            XML Import
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Property
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm text-gray-400">{filtered.length} {filtered.length === 1 ? 'property' : 'properties'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Beds</th>
                <th className="px-5 py-3">Area</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg shrink-0 overflow-hidden" style={{ background: p.color + '22' }}>
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-4 h-4" style={{ color: p.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 capitalize text-sm text-gray-600">{p.type}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.mode === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                      {p.mode === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{fmtPrice(p.price)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{p.bedrooms}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{p.area.toLocaleString()} ft²</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {deleteId === p.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Sure?</span>
                        <button onClick={() => { onDelete(p.id); setDeleteId(null); }}
                          className="text-xs text-red-500 hover:underline font-medium">Yes</button>
                        <button onClick={() => setDeleteId(null)}
                          className="text-xs text-gray-400 hover:underline">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => onApprove(p.id)}
                              title="Approve"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button onClick={() => onReject(p.id)}
                              title="Reject"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="w-px h-4 bg-gray-200" />
                          </>
                        )}
                        <button onClick={() => onEdit(p)}
                          title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
                          title="Delete"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400 text-sm">
                    No properties match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Users section ────────────────────────────────────────────────────────────────

function UsersSection({
  users, onToggle,
}: {
  users: AdminUser[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = filterRole   === 'all' || u.role   === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = [
    'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700',
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm text-gray-400">{filtered.length} {filtered.length === 1 ? 'user' : 'users'}</p>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {initials(u.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-8 text-sm text-gray-500">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Joined</p>
                  <p className="text-xs font-medium text-gray-600">{u.createdAt.slice(0, 10)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>{u.role}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[u.status]}`}>{u.status}</span>
                {u.role !== 'admin' && (
                  <button
                    onClick={() => onToggle(u.id)}
                    className={`text-xs font-medium transition-colors ${
                      u.status === 'active' || u.status === 'pending'
                        ? 'text-gray-400 hover:text-red-500'
                        : 'text-emerald-600 hover:text-emerald-700'
                    }`}>
                    {u.status === 'active' || u.status === 'pending' ? 'Suspend' : 'Unblock'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">No users match your filters</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Settings section ─────────────────────────────────────────────────────────────

const SETTINGS_DEFAULTS: SiteSettings = {
  siteName: 'Prime Estate', contactEmail: 'hello@primeestate.com',
  maxListingsPerUser: 10, currency: 'USD',
  allowRegistration: true, requireApproval: true, maintenanceMode: false,
};

function SettingsSection() {
  const [form, setForm] = useState<SiteSettings>(SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsService.get()
      .then(s => setForm(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await settingsService.update(form);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-400 py-8">Loading settings…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name</label>
            <input value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
            <input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Listings Per User</label>
            <input value={form.maxListingsPerUser} type="number" min="1"
              onChange={e => setForm(f => ({ ...f, maxListingsPerUser: Number(e.target.value) }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Platform Controls</h3>
        {([
          ['allowRegistration', 'Allow new user registrations', 'When disabled, only existing users can log in'],
          ['requireApproval',   'Require listing approval',     'New listings must be approved before going live'],
          ['maintenanceMode',   'Maintenance mode',             'Puts the site in maintenance mode for non-admin users'],
        ] as [keyof SiteSettings, string, string][]).map(([key, label, desc]) => (
          <div key={key} className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form[key] ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
        {saved ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved!
          </>
        ) : saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [showPropModal, setShowPropModal] = useState(false);
  const [editingProp, setEditingProp]     = useState<AdminProperty | null>(null);
  const [showXmlModal, setShowXmlModal]   = useState(false);
  const [toast, setToast]                 = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/auth'); return; }
    if (u.role !== 'admin') { router.replace('/home'); return; }
    setUser(u);
    propertyService.getAllAdmin().then(setProperties).catch(() => {});
    userService.getAll().then(setUsers).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => { logout(); router.replace('/auth'); };

  const openAdd  = () => { setEditingProp(null); setShowPropModal(true); };
  const openEdit = (p: AdminProperty) => { setEditingProp(p); setShowPropModal(true); };

  const handleSaveProp = async (form: PropForm) => {
    const payload = {
      title: form.title, price: Number(form.price),
      type: form.type as PropertyType, mode: form.mode as PropertyMode,
      location: form.location, city: form.city,
      bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms),
      area: Number(form.area), yearBuilt: Number(form.yearBuilt),
      garage: Number(form.garage), description: form.description,
      images: form.images,
      status: form.status,
    };
    if (editingProp) {
      const updated = await propertyService.update(editingProp.id, payload);
      setProperties(ps => ps.map(p => p.id === editingProp.id ? updated : p));
      showToast('Property updated successfully');
    } else {
      const created = await propertyService.create(payload);
      setProperties(ps => [created, ...ps]);
      showToast('Property added successfully');
    }
    setShowPropModal(false);
  };

  const handleDelete = async (id: string) => {
    await propertyService.remove(id);
    setProperties(ps => ps.filter(p => p.id !== id));
    showToast('Property deleted');
  };

  const handleApprove = async (id: string) => {
    const updated = await propertyService.update(id, { status: 'active' });
    setProperties(ps => ps.map(p => p.id === id ? updated : p));
    showToast('Property approved and set to active');
  };

  const handleReject = async (id: string) => {
    const updated = await propertyService.update(id, { status: 'sold' });
    setProperties(ps => ps.map(p => p.id === id ? updated : p));
    showToast('Property rejected');
  };

  const handleToggleUser = async (id: string) => {
    const u = users.find(u => u.id === id);
    if (!u) return;
    const next = u.status === 'suspended' ? 'active' : 'suspended';
    await userService.updateStatus(id, next);
    setUsers(us => us.map(u => u.id === id ? { ...u, status: next } : u));
    showToast(next === 'suspended' ? `${u.name} suspended` : `${u.name} unblocked`);
  };

  const handleXmlImport = async (rows: XmlRow[]) => {
    const created = await Promise.all(rows.map(r =>
      propertyService.create({
        title: r.title || 'Untitled Property',
        price: Number(r.price) || 0,
        type: (['house','apartment','villa','land'].includes(r.type) ? r.type : 'house') as PropertyType,
        mode: r.mode === 'rent' ? 'rent' : 'sale',
        location: r.location || '', city: r.city || '',
        bedrooms: Number(r.bedrooms) || 0, bathrooms: Number(r.bathrooms) || 0,
        area: Number(r.area) || 0,
        images: r.images ? r.images.split('\n').filter(Boolean) : [],
        status: 'pending',
      })
    ));
    setProperties(ps => [...created, ...ps]);
    showToast(`${created.length} properties imported — pending approval`);
    setActiveNav('properties');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Prime Estate</p>
            <p className="text-xs text-blue-600 font-medium">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeNav === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <NavIcon id={item.id} />
              {item.label}
              {item.id === 'properties' && (
                <span className="ml-auto text-xs font-semibold text-gray-400">{properties.length}</span>
              )}
              {item.id === 'users' && (
                <span className="ml-auto text-xs font-semibold text-gray-400">{users.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-gray-300 hover:text-red-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-900 capitalize">{activeNav}</h1>
          <button onClick={handleLogout} className="md:hidden text-sm text-gray-400 hover:text-red-500">Logout</button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeNav === 'dashboard'  && (
            <DashboardSection
              properties={properties}
              users={users}
              onImportClick={() => setShowXmlModal(true)}
              onNavChange={setActiveNav}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {activeNav === 'properties' && (
            <PropertiesSection
              properties={properties}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onImportClick={() => setShowXmlModal(true)}
            />
          )}
          {activeNav === 'users'    && <UsersSection users={users} onToggle={handleToggleUser} />}
          {activeNav === 'settings' && <SettingsSection />}
        </main>
      </div>

      {/* Modals */}
      {showPropModal && (
        <PropertyModal editing={editingProp} onSave={handleSaveProp} onClose={() => setShowPropModal(false)} />
      )}
      {showXmlModal && (
        <XmlModal onImport={handleXmlImport} onClose={() => setShowXmlModal(false)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
