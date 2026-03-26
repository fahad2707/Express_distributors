'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Package, Truck, MapPin, Clock } from 'lucide-react';

const API = typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');

interface OrderData {
  order_number: string;
  customer_name: string;
  items: { product_name: string; quantity: number; price: number; subtotal: number }[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  status_history: { status: string; timestamp: string }[];
  created_at: string;
}

const STATUS_STEPS = ['confirmed', 'packed', 'dispatched', 'delivered'];

function OrderConfirmationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderNum = params.get('order');
  const emailParam = params.get('email')?.trim().toLowerCase() || '';
  const [emailGate, setEmailGate] = useState(emailParam);
  const [emailDraft, setEmailDraft] = useState(params.get('email') || '');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const e = params.get('email')?.trim().toLowerCase() || '';
    setEmailGate(e);
    setEmailDraft(params.get('email') || '');
  }, [params]);

  useEffect(() => {
    if (!orderNum) {
      setLoading(false);
      return;
    }
    if (!emailGate) {
      setLoading(false);
      setOrder(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(
      `${API}/online-orders/track/${encodeURIComponent(orderNum)}?email=${encodeURIComponent(emailGate)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.order_number) setOrder(d);
        else setOrder(null);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderNum, emailGate]);

  if (!orderNum) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 px-4">
        Missing order reference. Return to the store to place an order.
      </div>
    );
  }

  if (!emailGate) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">View your order</h1>
          <p className="text-sm text-gray-600 mb-4">
            Enter the email address you used at checkout. This keeps your order details private.
          </p>
          <input
            type="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4 text-gray-900"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <button
            type="button"
            onClick={() => setEmailGate(emailDraft.trim().toLowerCase())}
            className="w-full bg-[#0f766e] text-white py-2.5 rounded-lg font-medium hover:opacity-95"
          >
            Load order
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 px-4 gap-2">
        <p>We couldn&apos;t find that order, or the email doesn&apos;t match.</p>
        <button
          type="button"
          className="text-[#0f766e] underline text-sm"
          onClick={() => {
            setEmailGate('');
            setOrder(null);
          }}
        >
          Try a different email
        </button>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isCancelled ? 'bg-red-100' : 'bg-green-100'}`}>
            <CheckCircle className={`w-8 h-8 ${isCancelled ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isCancelled ? 'Order Cancelled' : 'Thank You for Your Order!'}
          </h1>
          <p className="text-gray-600">
            Order <span className="font-semibold">{order.order_number}</span> •{' '}
            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Status timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="font-semibold mb-4">Order Status</h2>
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((s, i) => {
                const done = i <= currentIdx;
                const icons = [Package, Package, Truck, MapPin];
                const Icon = icons[i];
                return (
                  <div key={s} className="flex flex-col items-center flex-1 relative">
                    {i > 0 && (
                      <div className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${i <= currentIdx ? 'bg-[#0f766e]' : 'bg-gray-200'}`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${done ? 'bg-[#0f766e] text-white' : 'bg-gray-200 text-gray-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs mt-2 text-center capitalize text-gray-600">{s.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Timeline
          </h2>
          <ul className="space-y-3">
            {(order.status_history || []).map((h, idx) => (
              <li key={idx} className="text-sm text-gray-700 border-l-2 border-[#0f766e] pl-3">
                <span className="font-medium capitalize">{h.status.replace(/_/g, ' ')}</span>
                <span className="text-gray-500 ml-2">
                  {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="font-semibold mb-4">Items</h2>
          <ul className="divide-y">
            {order.items.map((it, i) => (
              <li key={i} className="py-3 flex justify-between text-sm">
                <span>
                  {it.product_name} × {it.quantity}
                </span>
                <span className="font-medium">${it.subtotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-2">
              <span>Total</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-[#0f766e] font-medium hover:underline"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
