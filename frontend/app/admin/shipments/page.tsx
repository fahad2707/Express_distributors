'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import adminApi from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface Shipment {
  id: string;
  shipment_number: string;
  shipment_type: string;
  linked_invoice_id?: string;
  status: string;
  transporter_name?: string;
  vehicle_number?: string;
  dispatch_date?: string;
  expected_delivery_date?: string;
  delivered_date?: string;
  freight_charge?: number;
  created_at: string;
  items?: { product_id: string; product_name?: string; quantity: number; status?: string }[];
}

export default function ShipmentsPage() {
  const [list, setList] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchList = async () => {
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      if (typeFilter) params.shipment_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.get('/shipments', { params });
      setList(res.data.shipments || []);
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [typeFilter, statusFilter]);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
      <p className="text-gray-600 mt-1">Outbound (GROUND) and return (GROUND_RG) shipments — track status and delivery</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="GROUND">GROUND</option>
          <option value="GROUND_RG">GROUND_RG (Return)</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="PACKED">PACKED</option>
          <option value="DISPATCHED">DISPATCHED</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="RETURNED">RETURNED</option>
          <option value="FAILED">FAILED</option>
        </select>
        <button
          type="button"
          onClick={() => fetchList()}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-white text-sm font-medium bg-[#0f766e]"
        >
          <Search className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0f766e] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0f766e] text-white">
                  <th className="text-left py-3 px-4 text-sm font-medium">Number</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Transporter</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Dispatch</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Expected</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Delivered</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Freight</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No shipments yet.
                    </td>
                  </tr>
                ) : (
                  list.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-4 text-sm font-medium">{s.shipment_number}</td>
                      <td className="py-2 px-4 text-sm">{s.shipment_type}</td>
                      <td className="py-2 px-4 text-sm">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            s.status === 'DELIVERED' || s.status === 'RETURNED'
                              ? 'bg-green-100 text-green-800'
                              : s.status === 'PENDING'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-sm">{s.transporter_name || '—'}</td>
                      <td className="py-2 px-4 text-sm">{s.vehicle_number || '—'}</td>
                      <td className="py-2 px-4 text-sm">{formatDate(s.dispatch_date)}</td>
                      <td className="py-2 px-4 text-sm">{formatDate(s.expected_delivery_date)}</td>
                      <td className="py-2 px-4 text-sm">{formatDate(s.delivered_date)}</td>
                      <td className="py-2 px-4 text-sm text-right">{s.freight_charge != null ? Number(s.freight_charge).toLocaleString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
