import { Suspense } from 'react';
import AdminLayoutClient from './AdminLayoutClient';

/** Avoid static prerender issues with client hooks like usePathname in the admin shell. */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Loading…
        </div>
      }
    >
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Suspense>
  );
}
