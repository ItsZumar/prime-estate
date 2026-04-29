"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, logout, AuthUser } from "@/lib/auth";
import { propertyService } from "@/lib/propertyService";
import type { Property } from "@/lib/properties";

type SearchMode = "Buy" | "Rent" | "Commercial";

const CATEGORIES = [
  {
    mode: "Buy",
    count: "4,500+",
    sub: "properties for sale",
    bg: "from-blue-50 to-blue-100",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    mode: "Rent",
    count: "2,100+",
    sub: "rentals available",
    bg: "from-emerald-50 to-emerald-100",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
        />
      </svg>
    ),
  },
  {
    mode: "Commercial",
    count: "800+",
    sub: "commercial spaces",
    bg: "from-purple-50 to-purple-100",
    border: "border-purple-200",
    text: "text-purple-700",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
];

const STATS = [
  { value: "10,000+", label: "Properties Listed" },
  { value: "500+", label: "Verified Agents" },
  { value: "50+", label: "Cities Covered" },
  { value: "98%", label: "Customer Satisfaction" },
];

const POPULAR = ["New York", "Los Angeles", "Miami", "Austin", "Seattle"];

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>("Buy");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("All");

  useEffect(() => {
    setUser(getUser());
    propertyService
      .getAll()
      .then((ps) => setFeatured(ps.slice(0, 6)))
      .catch(() => {});
  }, []);

  const navigate = (q: string, type: string, mode: string) => {
    const params = new URLSearchParams({ q, type, mode });
    router.push(`/listings?${params}`);
  };

  const handleSearch = () => navigate(location, propertyType, searchMode);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Prime Estate</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1">
            {(["Buy", "Rent", "Commercial", "About"] as const).map((item) => (
              <button
                key={item}
                onClick={() => item !== "About" && setSearchMode(item as SearchMode)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            {user ? (
              <>
                <button
                  onClick={() => router.push(user.role === "admin" ? "/admin" : "/home")}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                </button>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link
                  href="/auth"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-linear-to-br from-slate-900 via-blue-950 to-blue-800 py-24 px-4 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full border border-white" />
          <div className="absolute -bottom-32 -left-16 w-125 h-125 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-175 rounded-full border border-white" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center text-white">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-blue-200 mb-6">
            🏠 Premium Real Estate Platform
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-5">
            Find Your
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-300 to-cyan-300">Perfect Home</span>
          </h1>
          <p className="text-blue-200 text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Search from thousands of verified properties. Buy, rent, or list your own — all in one place.
          </p>

          {/* Search card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
            {/* Mode tabs */}
            <div className="flex border-b border-gray-100">
              {(["Buy", "Rent", "Commercial"] as SearchMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSearchMode(m)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                    searchMode === m ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="City, address, or ZIP code…"
                  className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="py-3 pl-3 pr-8 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {["All", "House", "Apartment", "Villa", "Land"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* Popular searches */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            <span className="text-blue-300 text-sm">Popular:</span>
            {POPULAR.map((city) => (
              <button
                key={city}
                onClick={() => {
                  setLocation(city);
                  navigate(city, propertyType, searchMode);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm text-white transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-blue-600 py-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-blue-200 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Browse by Category</h2>
            <p className="text-gray-500">Find exactly what you&apos;re looking for</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.mode}
                onClick={() => {
                  setSearchMode(cat.mode as SearchMode);
                  navigate(location, propertyType, cat.mode);
                }}
                className={`bg-linear-to-br ${cat.bg} border ${cat.border} rounded-2xl p-8 text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group`}
              >
                <div className={`${cat.text} mb-4`}>{cat.icon}</div>
                <p className={`text-2xl font-bold ${cat.text} mb-1`}>{cat.mode}</p>
                <p className="text-4xl font-extrabold text-gray-900 mb-1">{cat.count}</p>
                <p className="text-gray-500 text-sm">{cat.sub}</p>
                <div
                  className={`mt-4 flex items-center gap-1 text-sm font-medium ${cat.text} opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  Browse now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Properties</h2>
              <p className="text-gray-500">Handpicked premium listings just for you</p>
            </div>
            <button
              onClick={() => router.push("/listings")}
              className="hidden sm:flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/listings/${p.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              >
                {/* Image */}
                <div
                  className="h-52 relative overflow-hidden"
                  style={!p.images[0] ? { background: `linear-gradient(135deg, ${p.color}22, ${p.color}55)` } : {}}
                >
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-20 h-20 opacity-30"
                        style={{ color: p.color }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={0.8}
                          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M9 22V12h6v10" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white text-xs font-semibold text-gray-700 rounded-full shadow-sm capitalize">
                      {p.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold text-white rounded-full ${p.mode === "rent" ? "bg-emerald-500" : "bg-blue-600"}`}
                    >
                      For {p.mode === "rent" ? "Rent" : "Sale"}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{p.title}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-3">
                    ${p.price.toLocaleString()}
                    {p.mode === "rent" ? "/mo" : ""}
                  </p>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{p.location}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-50">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      {p.bedrooms} beds
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {p.bathrooms} baths
                    </span>
                    <span className="flex items-center gap-1 ml-auto text-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                      {p.area.toLocaleString()} ft²
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => router.push("/listings")}
              className="px-8 py-3.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold rounded-xl transition-all"
            >
              View All Properties
            </button>
          </div>
        </div>
      </section>

      {/* ── Post Property CTA ── */}
      <section className="py-20 px-4 bg-linear-to-br from-blue-900 to-blue-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Have a Property to Sell or Rent?</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto">
            List your property and connect with thousands of buyers and renters across the country.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={user ? "/dashboard" : "/auth"}
              className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Post Property
            </Link>
            <Link
              href="/listings"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-white text-sm">Prime Estate</p>
                <p className="text-xs">Find your perfect home</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              {["Buy", "Rent", "Commercial", "About", "Contact"].map((link) => (
                <button key={link} className="hover:text-white transition-colors">
                  {link}
                </button>
              ))}
            </div>
            <p className="text-xs">&copy; {new Date().getFullYear()} Prime Estate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
