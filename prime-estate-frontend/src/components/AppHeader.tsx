'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuthUser } from '@/lib/auth';

type Props = {
  user: AuthUser | null;
  onLogout?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  extraActions?: React.ReactNode;
};

const NAV_LINKS = [
  { href: '/listings', label: 'Browse' },
  { href: '/saved', label: 'Saved' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function AppHeader({ user, onLogout, search, onSearchChange, extraActions }: Props) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 hidden sm:block">Prime Estate</span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || (href === '/listings' && pathname.startsWith('/listings'));
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        {onSearchChange !== undefined && (
          <div className="hidden sm:flex flex-1 max-w-lg relative ml-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search ?? ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search properties, locations…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {extraActions}

          {user ? (
            <>
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
              </div>
              <button onClick={onLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="text-sm font-medium text-gray-600 hover:text-blue-600">Login</Link>
              <Link href="/auth" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">Register</Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
