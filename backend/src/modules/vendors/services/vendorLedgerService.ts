import mongoose from 'mongoose';
import LedgerEntry from '../../../models/LedgerEntry';
/**
 * Vendor balance = sum(debit) - sum(credit) for party_type VENDOR, party_id = vendor_id.
 * Positive = we owe vendor (payable).
 */
export async function getVendorBalance(
  vendorId: string | mongoose.Types.ObjectId,
  asOfDate?: Date
): Promise<number> {
  const id = typeof vendorId === 'string' ? new mongoose.Types.ObjectId(vendorId) : vendorId;
  const match: any = { party_type: 'VENDOR', party_id: id };
  if (asOfDate) match.date = { $lte: asOfDate };

  const agg = await LedgerEntry.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalDebit: { $sum: '$debit' },
        totalCredit: { $sum: '$credit' },
      },
    },
    { $project: { balance: { $subtract: ['$totalDebit', '$totalCredit'] } } },
  ]);

  return agg[0]?.balance ?? 0;
}

/**
 * Bulk vendor balances (for list). Returns Map of vendorId string -> balance.
 */
export async function getVendorBalancesBulk(
  vendorIds: (string | mongoose.Types.ObjectId)[],
  asOfDate?: Date
): Promise<Map<string, number>> {
  if (vendorIds.length === 0) return new Map();
  const ids = vendorIds.map((id) => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id));
  const match: any = { party_type: 'VENDOR', party_id: { $in: ids } };
  if (asOfDate) match.date = { $lte: asOfDate };

  const agg = await LedgerEntry.aggregate([
    { $match: match },
    { $group: { _id: '$party_id', totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } },
    { $project: { balance: { $subtract: ['$totalDebit', '$totalCredit'] } } },
  ]);

  const map = new Map<string, number>();
  for (const r of agg as any[]) {
    map.set(r._id.toString(), r.balance ?? 0);
  }
  return map;
}

/**
 * Vendor statement: list of ledger entries for the vendor with running balance.
 */
export async function getVendorStatement(
  vendorId: string | mongoose.Types.ObjectId,
  options: { fromDate?: Date; toDate?: Date; limit?: number; skip?: number } = {}
): Promise<{ entries: any[]; balanceAsOn: number }> {
  const id = typeof vendorId === 'string' ? new mongoose.Types.ObjectId(vendorId) : vendorId;
  const match: any = { party_type: 'VENDOR', party_id: id };
  if (options.fromDate || options.toDate) {
    match.date = {};
    if (options.fromDate) match.date.$gte = options.fromDate;
    if (options.toDate) match.date.$lte = options.toDate;
  }

  const balanceAsOn = await getVendorBalance(
    id,
    options.fromDate ? new Date(options.fromDate.getTime() - 1) : undefined
  );

  const entries = await LedgerEntry.find(match)
    .sort({ date: 1 })
    .skip(options.skip ?? 0)
    .limit(options.limit ?? 100)
    .lean();

  let running = balanceAsOn;
  const entriesWithBalance = (entries as any[]).reverse().map((e) => {
    const debit = e.debit ?? 0;
    const credit = e.credit ?? 0;
    running -= debit - credit;
    return {
      id: e._id.toString(),
      date: e.date,
      reference_type: e.reference_type,
      reference_id: e.reference_id?.toString(),
      description: e.description,
      debit,
      credit,
      balance: running,
    };
  });

  return { entries: entriesWithBalance.reverse(), balanceAsOn };
}

/**
 * Post vendor ledger entries. Call from: purchase invoice (DR VENDOR, CR PURCHASE),
 * payment (DR CASH/BANK, CR VENDOR), credit memo (already in creditMemoService: DR VENDOR, CR PURCHASE_RETURN),
 * debit note (DR VENDOR, CR ...).
 */
export async function postVendorLedger(
  vendorId: mongoose.Types.ObjectId,
  entries: { account_type: string; debit: number; credit: number; reference_type: string; reference_id: mongoose.Types.ObjectId; description?: string }[],
  createdBy?: mongoose.Types.ObjectId,
  session?: mongoose.mongo.ClientSession
): Promise<void> {
  const docs = entries.map((e) => ({
    date: new Date(),
    account_type: e.account_type,
    party_type: 'VENDOR' as const,
    party_id: vendorId,
    debit: e.debit,
    credit: e.credit,
    reference_type: e.reference_type,
    reference_id: e.reference_id,
    description: e.description,
    created_by: createdBy,
  }));

  if (session) {
    await LedgerEntry.insertMany(docs, { session });
  } else {
    await LedgerEntry.insertMany(docs);
  }
}
