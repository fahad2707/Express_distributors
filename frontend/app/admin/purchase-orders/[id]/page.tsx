'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Package, Check } from 'lucide-react';
import adminApi from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface POItem {
  product_id: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  subtotal: number;
}

interface PO {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor: { name: string; contact_name?: string; phone?: string };
  status: string;
  items: POItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  expected_date?: string;
  received_at?: string;
  notes?: string;
  created_at: string;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [po, setPo] = useState<PO | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});
  const [receiving, setReceiving] = useState(false);

  const fetchPO = async () => {
    try {
      const res = await adminApi.get(`/purchase-orders/${id}`);
      setPo(res.data);
      const initial: Record<string, number> = {};
      (res.data.items || []).forEach((i: POItem) => {
        const remaining = i.quantity_ordered - (i.quantity_received || 0);
        initial[i.product_id] = remaining > 0 ? remaining : 0;
      });
      setReceiveQty(initial);
    } catch {
      toast.error('Failed to load purchase order');
      router.push('/admin/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPO();
  }, [id]);

  const handleSend = async () => {
    try {
      await adminApi.post(`/purchase-orders/${id}/send`);
      toast.success('PO marked as sent');
      fetchPO();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleReceive = async () => {
    if (!po) return;
    const items = po.items
      .filter((i) => (receiveQty[i.product_id] || 0) > 0)
      .map((i) => ({ product_id: i.product_id, quantity_received: receiveQty[i.product_id] || 0 }));
    if (items.length === 0) {
      toast.error('Enter quantities to receive');
      return;
    }
    setReceiving(true);
    try {
      await adminApi.post(`/purchase-orders/${id}/receive`, { items });
      toast.success('Stock updated');
      fetchPO();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to receive');
    } finally {
      setReceiving(false);
    }
  };

  if (loading || !po) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const canReceive = po.status === 'sent' || po.status === 'partial' || po.status === 'draft';
  const canSend = po.status === 'draft';

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/purchase-orders" className="inline-flex items-center gap-2 text-primary-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Orders
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{po.po_number}</h1>
          <p className="text-gray-600 mt-1">
            {po.vendor?.name} •{' '}
            <span
              className={`px-2 py-0.5 rounded text-sm font-medium ${
                po.status === 'received' ? 'bg-green-100 text-green-800' : po.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {po.status}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Mark as sent
            </button>
          )}
          {canReceive && (
            <button onClick={handleReceive} disabled={receiving} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
              <Check className="w-4 h-4" />
              {receiving ? 'Receiving...' : 'Receive stock'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-gray-700">Product</th>
              <th className="text-right py-3 px-4 text-gray-700">Ordered</th>
              <th className="text-right py-3 px-4 text-gray-700">Received</th>
              {canReceive && <th className="text-right py-3 px-4 text-gray-700">Qty to receive</th>}
              <th className="text-right py-3 px-4 text-gray-700">Unit cost</th>
              <th className="text-right py-3 px-4 text-gray-700">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {po.items?.map((item) => {
              const remaining = item.quantity_ordered - (item.quantity_received || 0);
              return (
                <tr key={item.product_id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-gray-400" />
                      {item.product_name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{item.quantity_ordered}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{item.quantity_received || 0}</td>
                  {canReceive && (
                    <td className="py-3 px-4 text-right">
                      {remaining > 0 ? (
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={receiveQty[item.product_id] ?? remaining}
                          onChange={(e) => setReceiveQty({ ...receiveQty, [item.product_id]: parseInt(e.target.value, 10) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      ) : (
                        <span className="text-green-600">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right font-mono">${Number(item.unit_cost).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 max-w-sm ml-auto">
        <div className="flex justify-between text-gray-700 mb-2">
          <span>Subtotal</span>
          <span className="font-mono">${Number(po.subtotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700 mb-2">
          <span>Tax</span>
          <span className="font-mono">${Number(po.tax_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
          <span>Total</span>
          <span className="font-mono">${Number(po.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {po.notes && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
          <p className="text-gray-600">{po.notes}</p>
        </div>
      )}
    </div>
  );
}
