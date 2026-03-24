'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, Gift, Settings, LogOut, ShoppingCart, Home } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useCartStore } from '@/lib/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, logout } = useAuthStore();
  const { getItemCount } = useCartStore();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/store/orders', label: 'My Orders', icon: Package },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-50">
      {/* Top Navigation */}
      <nav className="bg-[#0f1115]/95 border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-shrink-0 flex items-end">
              <img
                src="/logo.png"
                alt="Express Distributors Inc"
                className="h-[50px] md:h-[70px] w-auto drop-shadow-[0_0_20px_rgba(124,92,255,0.7)]"
              />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline tracking-[0.14em] uppercase text-xs">Shop</span>
              </Link>
              <Link
                href="/store/cart"
                className="relative p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-100" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#7c5cff] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {getItemCount()}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline tracking-[0.14em] uppercase text-xs">Logout</span>
              </button>
            </div>
          </div>

          {/* Dashboard Navigation */}
          <div className="flex items-center gap-1 mt-4 border-t border-white/10 pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#7c5cff] text-white'
                      : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

