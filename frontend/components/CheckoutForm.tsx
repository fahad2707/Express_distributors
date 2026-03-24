'use client';

import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, CheckCircle, Lock, CreditCard, Shield } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  total: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CheckoutForm({ items, total, onSuccess, onCancel }: CheckoutFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!stripe) {
      toast.error('Payment system not available');
      onCancel();
    }
  }, [stripe, onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/store/orders`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order
        try {
          await api.post('/orders', {
            items: items.map(item => ({
              product_id: item.product_id.toString(),
              quantity: item.quantity,
            })),
            payment_intent_id: paymentIntent.id,
          });

          setSuccess(true);
          toast.success('Order placed successfully!');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } catch (orderError: any) {
          console.error('Order creation error:', orderError);
          toast.error(orderError.response?.data?.error || 'Order created but payment may need verification');
          // Still show success since payment went through
          setSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process order');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 text-lg">
            Your order is being processed. You&apos;ll receive a confirmation shortly.
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <p className="text-2xl font-bold text-primary-600 mb-2">${total.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Total Amount Paid</p>
        </div>
        <p className="text-sm text-gray-500">Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Cart
        </button>
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6" />
          <h2 className="text-3xl font-bold">Secure Checkout</h2>
        </div>
      </div>

      <div className="p-8">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-700">
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-primary-600">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Payment Information</h3>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <PaymentElement />
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Your payment is secured and encrypted by Stripe</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Pay ${total.toFixed(2)}
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By completing this purchase, you agree to our terms of service and privacy policy.
          </p>
        </form>
      </div>
    </div>
  );
}
