'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabClass = (active: boolean) =>
  `inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? 'bg-[#0f766e] text-white shadow-sm'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`;

export default function ProductsSectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInactive = pathname?.includes('/admin/products/inactive');

  return (
    <div>
      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Product lists">
        <Link href="/admin/products/active" className={tabClass(!isInactive)}>
          Active products
        </Link>
        <Link href="/admin/products/inactive" className={tabClass(isInactive)}>
          Inactive products
        </Link>
      </nav>
      {children}
    </div>
  );
}
