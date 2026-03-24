'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, Truck, Store, Clock, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface OrderItem {
  id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface StatusHistory {
  status: string;
  notes?: string;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
  status_history: StatusHistory[];
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  placed: { label: 'Order Placed', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  packed: { label: 'Packed', icon: CheckCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  ready_for_pickup: { label: 'Ready for Pickup', icon: Store, color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', icon: X, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [token, router]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Package className="w-8 h-8 text-primary-600" />
          <h1 className="text-4xl font-bold text-gray-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.placed;
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`${statusInfo.bgColor} ${statusInfo.color} px-4 py-2 rounded-full flex items-center gap-2`}>
                          <StatusIcon className="w-5 h-5" />
                          <span className="font-semibold">{statusInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Items Ordered</h4>
                    <div className="space-y-4 mb-6">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                              <span className="text-2xl text-white font-bold">
                                {item.product_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold text-lg text-gray-900">
                            ${item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Status Timeline */}
                    {order.status_history && order.status_history.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Order Timeline</h4>
                        <div className="space-y-3">
                          {order.status_history.map((history, idx) => {
                            const histStatusInfo = statusConfig[history.status] || statusConfig.placed;
                            const HistIcon = histStatusInfo.icon;
                            return (
                              <div key={idx} className="flex items-start gap-3">
                                <div className={`${histStatusInfo.bgColor} p-2 rounded-lg`}>
                                  <HistIcon className={`w-4 h-4 ${histStatusInfo.color}`} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{histStatusInfo.label}</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(history.created_at).toLocaleString()}
                                  </p>
                                  {history.notes && (
                                    <p className="text-sm text-gray-500 mt-1">{history.notes}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                      <span className="text-3xl font-bold text-primary-600">
                        ${parseFloat(order.total_amount.toString()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
