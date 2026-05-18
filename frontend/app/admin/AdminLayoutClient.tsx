'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  LogOut,
  Users,
  Truck,
  ClipboardList,
  Warehouse,
  Settings,
  Bell,
  FileSignature,
  PackageCheck,
  FolderTree,
  Wallet,
  Landmark,
  MessageSquare,
} from 'lucide-react';

const SIDEBAR_BG = 'bg-[#0f766e]';
const SIDEBAR_ACTIVE = 'bg-teal-500';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Start as `true` so children mount and may begin their data fetches.
  // The auth check below will redirect away on the next paint if the token
  // is genuinely missing. This avoids a blank flash for users who reload.
  const [hasToken, setHasToken] = useState<boolean>(true);

  // Gate admin pages behind a localStorage token. We check after mount so
  // SSR-safe code runs identically on the server, and react to "storage"
  // events so logging out in one tab signs you out everywhere.
  useEffect(() => {
    if (pathname === '/admin/login') {
      setHasToken(true);
      return;
    }
    const check = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      setHasToken(!!token);
      if (!token) {
        // Soft Next.js redirect — admin-api also redirects on 401 but only
        // after the login grace period expires.
        const target = `/admin/login?next=${encodeURIComponent(pathname || '/admin')}`;
        router.replace(target);
      }
    };
    check();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'adminToken') check();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoginAt');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
        Redirecting to login…
      </div>
    );
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/rfq', label: 'Quote Requests', icon: MessageSquare },
    { href: '/admin/invoices', label: 'Invoice', icon: FileText },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/catalog', label: 'Categories & Tax', icon: FolderTree },
    { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    { href: '/admin/vendors', label: 'Suppliers', icon: Truck },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/purchase-orders', label: 'Purchases', icon: ClipboardList },
    { href: '/admin/orders', label: 'Sales', icon: ShoppingCart },
    { href: '/admin/credit-memos', label: 'Credit Memos', icon: FileSignature },
    { href: '/admin/shipments', label: 'Shipments', icon: PackageCheck },
    { href: '/admin/receipts', label: 'Bank transactions', icon: Landmark },
    { href: '/admin/expenses', label: 'Expenses', icon: Wallet },
    { href: '/admin/analytics', label: 'Reports', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-dvh min-h-0 overflow-hidden bg-gray-100 flex flex-col">
      <div className="flex flex-1 min-h-0">
        <aside className={`w-56 ${SIDEBAR_BG} text-white flex flex-col shrink-0 h-full min-h-0`}>
          <div className="p-4 flex items-center gap-2 border-b border-white/10 shrink-0">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Express Inventory</span>
          </div>
          <nav className="flex-1 min-h-0 p-3 space-y-0.5 overflow-y-auto overscroll-contain">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive ? `${SIDEBAR_ACTIVE} text-white` : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4 flex-shrink-0">
            <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <Link href="/admin/settings" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Settings">
              <Settings className="w-5 h-5" />
            </Link>
            <button type="button" className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium" aria-label="Profile">
              A
            </button>
          </header>

          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
