'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, Lock, Truck, CreditCard } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '@/components/CheckoutForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

// Only load Stripe if key is available
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey && stripeKey !== '' ? loadStripe(stripeKey) : null;

export default function CartPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Require login to view cart
    if (!token) {
      router.push('/login?redirect=/store/cart');
      return;
    }
  }, [router, token]);

  const handleCheckout = async () => {
    if (!token) {
      toast.error('Please login to checkout');
      router.push('/login');
      return;
    }

    // If Stripe is not configured, show message
    if (!stripePromise) {
      toast.error('Payment system not configured. Please contact support.');
      return;
    }

    try {
      const response = await api.post('/orders/create-payment-intent', {
        amount: getTotal(),
      });
      setClientSecret(response.data.clientSecret);
      setShowCheckout(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to initialize checkout');
    }
  };

  if (showCheckout && clientSecret && stripePromise) {
    return (
      <div className="min-h-screen bg-[#0f1115] py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              items={items as any}
              total={getTotal()}
              onSuccess={() => {
                clearCart();
                router.push('/store/orders');
              }}
              onCancel={() => setShowCheckout(false)}
            />
          </Elements>
        </div>
      </div>
    );
  }

  const subtotal = getTotal();
  const tax = 0;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Continue Shopping
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-8 h-8 text-[#7c5cff]" />
          <h1 className="text-4xl font-bold text-slate-50 tracking-[0.04em]">Shopping Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <ShoppingBag className="w-20 h-20 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-50 mb-2">Your cart is empty</h2>
            <p className="text-slate-300 mb-6">Start adding items to your cart</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 glass-button glass-button-gradient px-6 py-3 rounded-lg font-semibold transition-all hover:scale-[1.03]"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="glass-panel transition-shadow p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#7c5cff] to-[#4f8cff] rounded-xl flex items-center justify-center">
                      <span className="text-3xl text-white font-bold">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-slate-50 mb-1 truncate">{item.name}</h3>
                    <p className="text-[#c7d2ff] font-bold text-lg mb-3">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 border-2 border-white/15 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="p-2 hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 font-semibold min-w-[3rem] text-center text-slate-50">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="p-2 hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-xl text-slate-50">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="p-3 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors self-start sm:self-center"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-panel p-6 sticky top-4">
                <h2 className="text-2xl font-bold mb-6 text-slate-50">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-200">
                    <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>Tax</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-400">Free</span>
                  </div>
                  <div className="border-t border-white/15 pt-4 flex justify-between text-xl font-bold">
                    <span className="text-slate-50">Total</span>
                    <span className="text-[#c7d2ff]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {!stripePromise && (
                  <div className="mb-4 p-4 bg-amber-900/40 border border-amber-500/60 rounded-lg">
                    <p className="text-sm text-amber-100">
                      ⚠️ Payment system not configured. Add Stripe keys to enable checkout.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={!stripePromise}
                  className="w-full glass-button glass-button-gradient text-white py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mb-4 shadow-lg"
                >
                  <Lock className="w-5 h-5" />
                  {stripePromise ? 'Proceed to Checkout' : 'Payment Not Available'}
                </button>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                  <Truck className="w-5 h-5 text-slate-200 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-200">
                    <p className="font-semibold mb-1">Store Pickup Only</p>
                    <p className="text-slate-300">Your order will be ready for pickup at our store location.</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    {stripePromise ? '🔒 Secure checkout powered by Stripe' : '💳 Payment setup required'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
