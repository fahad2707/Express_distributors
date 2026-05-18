'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ClipboardList,
  FileSignature,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  Trash2,
  ExternalLink,
  X,
  Package,
} from 'lucide-react';
import adminApi from '@/lib/admin-api';
import { isAdminAuthRedirectError } from '@/lib/admin-auth-redirect';
import { formatApiError } from '@/lib/format-api-error';
import toast from 'react-hot-toast';
import InvoiceFormLightbox, { type InvoiceInitialItem } from '@/components/admin/InvoiceFormLightbox';

interface RFQItem {
  product_id: string | null;
  product_name: string;
  category_name?: string;
  image_url?: string;
  quantity: number;
}

interface RFQ {
  id: string;
  rfq_number: string;
  status: 'pending' | 'quoted' | 'closed' | 'cancelled';
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_company?: string;
  customer_comments?: string;
  items: RFQItem[];
  item_count: number;
  quotation_id: string | null;
  quotation_number?: string;
  source: 'website' | 'store' | 'manual';
  created_at: string;
  updated_at: string;
}

interface RFQListResponse {
  rfqs: RFQ[];
  summary?: { pending?: number; quoted?: number };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_STYLES: Record<RFQ['status'], { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  quoted: { label: 'Quoted', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', cls: 'bg-gray-200 text-gray-700 border-gray-300' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function AdminRFQPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RFQ['status']>('all');
  const [selected, setSelected] = useState<RFQ | null>(null);
  const [summary, setSummary] = useState<{ pending: number; quoted: number }>({ pending: 0, quoted: 0 });

  // Quotation lightbox
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationCustomerId, setQuotationCustomerId] = useState<string | null>(null);
  const [quotationItems, setQuotationItems] = useState<InvoiceInitialItem[]>([]);
  const [pendingRfqId, setPendingRfqId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  const fetchRfqs = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminApi.get<RFQListResponse>('/rfq', { params });
      setRfqs(res.data.rfqs || []);
      setSummary({
        pending: res.data.summary?.pending ?? 0,
        quoted: res.data.summary?.quoted ?? 0,
      });
    } catch (error) {
      if (isAdminAuthRedirectError(error)) return;
      toast.error(formatApiError(error, 'Failed to load quote requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetchRfqs();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const filteredRfqs = useMemo(() => rfqs, [rfqs]);

  const handleGenerateQuotation = async (rfq: RFQ) => {
    if (preparing) return;
    setPreparing(true);
    try {
      const ensureRes = await adminApi.post(`/rfq/${rfq.id}/ensure-customer`, {});
      const customerId = ensureRes.data?.customer_id as string | undefined;
      const items: InvoiceInitialItem[] = rfq.items.map((it) => ({
        product_id: it.product_id || undefined,
        product_name: it.product_name,
        category_name: it.category_name,
        quantity: it.quantity,
      }));
      setQuotationCustomerId(customerId || null);
      setQuotationItems(items);
      setPendingRfqId(rfq.id);
      setQuotationOpen(true);
    } catch (error) {
      toast.error(formatApiError(error, 'Failed to prepare quotation'));
    } finally {
      setPreparing(false);
    }
  };

  const handleQuotationSaved = async (savedId?: string) => {
    if (pendingRfqId && savedId) {
      try {
        await adminApi.post(`/rfq/${pendingRfqId}/link-quotation`, { quotation_id: savedId });
        toast.success('Quotation linked to RFQ');
      } catch {
        // Linking failure shouldn't block the user from seeing the quotation
      }
    }
    fetchRfqs();
  };

  const handleQuotationClose = () => {
    setQuotationOpen(false);
    setQuotationCustomerId(null);
    setQuotationItems([]);
    setPendingRfqId(null);
  };

  const handleStatusChange = async (rfq: RFQ, status: RFQ['status']) => {
    try {
      await adminApi.patch(`/rfq/${rfq.id}`, { status });
      toast.success('Status updated');
      fetchRfqs();
    } catch (error) {
      toast.error(formatApiError(error, 'Failed to update status'));
    }
  };

  const handleDelete = async (rfq: RFQ) => {
    if (!confirm(`Delete RFQ ${rfq.rfq_number}? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/rfq/${rfq.id}`);
      toast.success('RFQ deleted');
      setSelected((cur) => (cur?.id === rfq.id ? null : cur));
      fetchRfqs();
    } catch (error) {
      toast.error(formatApiError(error, 'Failed to delete RFQ'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Requests (RFQ)</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Customer requests from the website. Generate a quotation to share prices via WhatsApp/email.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-amber-700 mt-0.5">{summary.pending}</p>
            </div>
            <ClipboardList className="w-7 h-7 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Quoted</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{summary.quoted}</p>
            </div>
            <FileSignature className="w-7 h-7 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total visible</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{rfqs.length}</p>
            </div>
            <Package className="w-7 h-7 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="RFQ number, customer name, company, phone or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | RFQ['status'])}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="quoted">Quoted</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#0f766e] border-t-transparent" />
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No quote requests yet.</p>
          <p className="text-gray-500 text-sm mt-1">
            When customers submit RFQs from the website they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f766e] text-white">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">RFQ #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Contact</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRfqs.map((rfq) => {
                  const status = STATUS_STYLES[rfq.status] || STATUS_STYLES.pending;
                  return (
                    <tr
                      key={rfq.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(rfq)}
                    >
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {new Date(rfq.created_at).toLocaleDateString()}{' '}
                        <span className="text-gray-400 text-xs">
                          {new Date(rfq.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-900">{rfq.rfq_number}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{rfq.customer_name}</p>
                        {rfq.customer_company && (
                          <p className="text-xs text-gray-600">{rfq.customer_company}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        <p className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {rfq.customer_phone}
                        </p>
                        {rfq.customer_email && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {rfq.customer_email}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 text-sm">
                        <span className="font-semibold text-gray-900">{rfq.items.length}</span>{' '}
                        <span className="text-xs text-gray-500">
                          ({rfq.item_count} unit{rfq.item_count === 1 ? '' : 's'})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-semibold border ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleGenerateQuotation(rfq)}
                            disabled={preparing}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f766e] text-white rounded-lg text-xs font-medium hover:bg-[#0d6b63] disabled:opacity-60"
                            title="Generate quotation"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            Generate quotation
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelected(rfq)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="View details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rfq)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#0f766e]" />
                  {selected.rfq_number}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submitted {new Date(selected.created_at).toLocaleString()} · Source:{' '}
                  {selected.source}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs uppercase text-gray-500 font-medium">Customer</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {selected.customer_name}
                  </p>
                  {selected.customer_company && (
                    <p className="flex items-center gap-1 text-sm text-gray-700 mt-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {selected.customer_company}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs uppercase text-gray-500 font-medium">Contact</p>
                  <p className="flex items-center gap-1 text-sm text-gray-800 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${selected.customer_phone}`}
                      className="hover:text-[#0f766e]"
                    >
                      {selected.customer_phone}
                    </a>
                  </p>
                  {selected.customer_email && (
                    <p className="flex items-center gap-1 text-sm text-gray-800 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${selected.customer_email}`}
                        className="hover:text-[#0f766e]"
                      >
                        {selected.customer_email}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {selected.customer_comments && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs uppercase text-amber-700 font-medium flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Customer comments
                  </p>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">
                    {selected.customer_comments}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase text-gray-500 font-medium mb-2">
                  Requested products ({selected.items.length})
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium">#</th>
                        <th className="text-left py-2 px-3 font-medium">Product</th>
                        <th className="text-left py-2 px-3 font-medium">Category</th>
                        <th className="text-right py-2 px-3 font-medium">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((it, idx) => (
                        <tr key={`${it.product_id || it.product_name}-${idx}`} className="border-t border-gray-100">
                          <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-3 text-gray-900">{it.product_name}</td>
                          <td className="py-2 px-3 text-gray-600">{it.category_name || '—'}</td>
                          <td className="py-2 px-3 text-right font-semibold">{it.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 flex flex-wrap items-center gap-3">
                <p className="text-xs uppercase text-gray-500 font-medium">Update status</p>
                {(['pending', 'quoted', 'closed', 'cancelled'] as const).map((s) => {
                  const style = STATUS_STYLES[s];
                  const active = selected.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(selected, s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        active ? style.cls + ' ring-2 ring-offset-1 ring-[#0f766e]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Customer expects prices via WhatsApp / email. Generate a quotation to send.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(selected)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateQuotation(selected)}
                  disabled={preparing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f766e] text-white rounded-lg text-sm font-medium hover:bg-[#0d6b63] disabled:opacity-60"
                >
                  <FileSignature className="w-4 h-4" />
                  Generate quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <InvoiceFormLightbox
        isOpen={quotationOpen}
        onClose={handleQuotationClose}
        onSaved={handleQuotationSaved}
        initialCustomerId={quotationCustomerId}
        initialDocumentType="quotation"
        initialItems={quotationItems}
      />
    </div>
  );
}
