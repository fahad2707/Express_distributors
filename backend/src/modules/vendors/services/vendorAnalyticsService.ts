import mongoose from 'mongoose';
import PurchaseOrder from '../../../models/PurchaseOrder';
import CreditMemo from '../../credit-memo/models/CreditMemo';
import Vendor from '../../../models/Vendor';
import { getVendorBalance } from './vendorLedgerService';

export interface VendorOutstandingRow {
  vendor_id: string;
  vendor_name: string;
  balance: number;
  credit_limit?: number;
  utilization_percent?: number;
  payment_terms_days?: number;
}

/**
 * Outstanding balance per vendor (from ledger). Optionally include credit_limit and utilization %.
 */
export async function getVendorOutstanding(): Promise<VendorOutstandingRow[]> {
  const vendors = await Vendor.find({ is_active: true, status: 'ACTIVE' }).lean();
  const rows: VendorOutstandingRow[] = [];
  for (const v of vendors as any[]) {
    const balance = await getVendorBalance(v._id);
    if (balance <= 0) continue; // only show payable
    const credit_limit = v.credit_limit;
    const utilization_percent =
      typeof credit_limit === 'number' && credit_limit > 0
        ? Math.min(100, Math.round((balance / credit_limit) * 100))
        : undefined;
    rows.push({
      vendor_id: v._id.toString(),
      vendor_name: v.name,
      balance,
      credit_limit,
      utilization_percent,
      payment_terms_days: v.payment_terms_days,
    });
  }
  return rows.sort((a, b) => b.balance - a.balance);
}

/**
 * Overdue: outstanding balance where expected_due_date < today (using PO expected_date + payment_terms).
 * Simplified: we consider PO total as due on expected_date + payment_terms_days; if no received_at, use expected_date.
 */
export async function getVendorOverdue(): Promise<{ vendor_id: string; vendor_name: string; balance: number; overdue_days: number }[]> {
  const outstanding = await getVendorOutstanding();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: { vendor_id: string; vendor_name: string; balance: number; overdue_days: number }[] = [];

  for (const row of outstanding) {
    const vendor = await Vendor.findById(row.vendor_id).lean();
    const termsDays = (vendor as any)?.payment_terms_days ?? 30;
    // Heuristic: get latest PO expected_date for this vendor; due = expected_date + terms
    const latestPo = await PurchaseOrder.findOne({ vendor_id: row.vendor_id, status: { $in: ['sent', 'partial', 'received'] } })
      .sort({ expected_date: -1 })
      .select('expected_date received_at')
      .lean();
    const dueDate = latestPo?.expected_date
      ? new Date((latestPo as any).expected_date.getTime() + termsDays * 24 * 60 * 60 * 1000)
      : null;
    if (dueDate && dueDate < today && row.balance > 0) {
      const overdue_days = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      result.push({
        vendor_id: row.vendor_id,
        vendor_name: row.vendor_name,
        balance: row.balance,
        overdue_days,
      });
    }
  }
  return result.sort((a, b) => b.overdue_days - a.overdue_days);
}

/**
 * On-time delivery % and average delay days from Purchase Orders (expected_date vs received_at).
 */
export async function getVendorDeliveryPerformance(
  vendorId?: string
): Promise<{
  vendor_id?: string;
  vendor_name?: string;
  total_orders: number;
  on_time_count: number;
  on_time_percent: number;
  average_delay_days: number;
}[]> {
  const match: any = { status: 'received', received_at: { $exists: true, $ne: null }, expected_date: { $exists: true, $ne: null } };
  if (vendorId) match.vendor_id = new mongoose.Types.ObjectId(vendorId);

  const pos = await PurchaseOrder.find(match)
    .populate('vendor_id', 'name')
    .select('vendor_id expected_date received_at')
    .lean();

  const byVendor = new Map<
    string,
    { vendor_name: string; delays: number[]; onTime: number; total: number }
  >();

  for (const po of pos as any[]) {
    const vid = po.vendor_id?._id?.toString() ?? po.vendor_id?.toString();
    if (!vid) continue;
    const expected = new Date(po.expected_date).getTime();
    const received = new Date(po.received_at).getTime();
    const delayDays = (received - expected) / (24 * 60 * 60 * 1000);
    const onTime = delayDays <= 0 ? 1 : 0;

    if (!byVendor.has(vid)) {
      byVendor.set(vid, {
        vendor_name: po.vendor_id?.name ?? 'Unknown',
        delays: [],
        onTime: 0,
        total: 0,
      });
    }
    const r = byVendor.get(vid)!;
    r.total += 1;
    r.onTime += onTime;
    r.delays.push(delayDays);
  }

  return Array.from(byVendor.entries()).map(([vendor_id, r]) => {
    const total = r.total;
    const on_time_count = r.onTime;
    const on_time_percent = total ? Math.round((on_time_count / total) * 100) : 0;
    const avgDelay =
      r.delays.length > 0
        ? r.delays.reduce((a, b) => a + b, 0) / r.delays.length
        : 0;
    return {
      vendor_id,
      vendor_name: r.vendor_name,
      total_orders: total,
      on_time_count,
      on_time_percent,
      average_delay_days: Math.round(avgDelay * 10) / 10,
    };
  });
}

/**
 * Returns per vendor (from approved vendor credit memos): total returns, damage %, return ratio.
 */
export async function getVendorReturnsAnalytics(vendorId?: string): Promise<
  {
    vendor_id: string;
    vendor_name: string;
    total_returns_amount: number;
    total_returns_count: number;
    by_reason: Record<string, { count: number; amount: number }>;
    damage_percent: number;
  }[]
> {
  const match: any = { type: 'VENDOR', status: 'APPROVED' };
  if (vendorId) match.vendor_id = new mongoose.Types.ObjectId(vendorId);

  const cms = await CreditMemo.find(match)
    .populate('vendor_id', 'name')
    .lean();

  const byVendor = new Map<
    string,
    { vendor_name: string; amount: number; count: number; by_reason: Record<string, { count: number; amount: number }> }
  >();

  for (const cm of cms as any[]) {
    const vid = cm.vendor_id?._id?.toString() ?? cm.vendor_id?.toString();
    if (!vid) continue;
    const vendor_name = cm.vendor_id?.name ?? 'Unknown';
    const amount = cm.total_amount ?? 0;
    const reason = cm.reason ?? 'OTHER';

    if (!byVendor.has(vid)) {
      byVendor.set(vid, { vendor_name, amount: 0, count: 0, by_reason: {} });
    }
    const r = byVendor.get(vid)!;
    r.amount += amount;
    r.count += 1;
    if (!r.by_reason[reason]) r.by_reason[reason] = { count: 0, amount: 0 };
    r.by_reason[reason].count += 1;
    r.by_reason[reason].amount += amount;
  }

  return Array.from(byVendor.entries()).map(([vendor_id, r]) => {
    const damageCount = r.by_reason['DAMAGED']?.count ?? 0;
    const damage_percent = r.count ? Math.round((damageCount / r.count) * 100) : 0;
    return {
      vendor_id,
      vendor_name: r.vendor_name,
      total_returns_amount: r.amount,
      total_returns_count: r.count,
      by_reason: r.by_reason,
      damage_percent,
    };
  });
}

/**
 * Last purchase price per product (from PO items). Optional: by vendor for multi-vendor per product.
 */
export async function getLastPurchasePrices(
  productId?: string,
  vendorId?: string
): Promise<{ product_id: string; vendor_id: string; vendor_name: string; unit_cost: number; po_number: string; received_at: Date }[]> {
  const match: any = { status: 'received' };
  if (vendorId) match.vendor_id = new mongoose.Types.ObjectId(vendorId);

  const pos = await PurchaseOrder.find(match)
    .populate('vendor_id', 'name')
    .sort({ received_at: -1 })
    .lean();

  const seen = new Set<string>();
  const result: { product_id: string; vendor_id: string; vendor_name: string; unit_cost: number; po_number: string; received_at: Date }[] = [];

  for (const po of pos as any[]) {
    const vid = po.vendor_id?._id?.toString();
    const vendor_name = (po as any).vendor_id?.name ?? 'Unknown';
    for (const item of (po as any).items || []) {
      const pid = item.product_id?.toString();
      if (!pid) continue;
      if (productId && pid !== productId) continue;
      const key = vendorId ? pid : `${pid}_${vid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        product_id: pid,
        vendor_id: vid ?? '',
        vendor_name,
        unit_cost: item.unit_cost ?? 0,
        po_number: (po as any).po_number,
        received_at: (po as any).received_at,
      });
    }
  }
  return result;
}
