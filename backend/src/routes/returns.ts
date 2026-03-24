import express from 'express';
import Return from '../models/Return';
import POSSale from '../models/POSSale';
import Product from '../models/Product';
import StockMovement from '../models/StockMovement';
import Customer from '../models/Customer';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const generateReturnNumber = () => `RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// List returns
router.get('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { limit = 50 } = req.query;
    const returns = await Return.find()
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .lean();
    res.json({
      returns: returns.map((r: any) => ({
        id: r._id.toString(),
        return_number: r.return_number,
        sale_id: r.sale_id?.toString(),
        order_id: r.order_id?.toString(),
        total_refund: r.total_refund,
        reason: r.reason,
        refund_method: r.refund_method,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (error) {
    console.error('List returns error:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Create return (with reason required for audit)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      sale_id: z.string().optional(),
      order_id: z.string().optional(),
      pos_customer_id: z.string().optional(),
      customer_id: z.string().optional(),
      items: z.array(
        z.object({
          product_id: z.string(),
          product_name: z.string(),
          quantity: z.number().int().positive(),
          price: z.number(),
          reason: z.string().min(1, 'Reason is required for audit'),
        })
      ),
      reason: z.string().min(1, 'Overall reason is required for audit'),
      refund_method: z.enum(['original', 'store_credit', 'cash', 'card']),
      store_credit_issued: z.number().min(0).optional(),
    });

    const data = schema.parse(req.body);
    if (!data.sale_id && !data.order_id) {
      return res.status(400).json({ error: 'sale_id or order_id required' });
    }
    if (data.items.length === 0) {
      return res.status(400).json({ error: 'At least one item required' });
    }

    const totalRefund = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const returnItems = data.items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      price: i.price,
      reason: i.reason,
      subtotal: i.price * i.quantity,
    }));

    const returnDoc = await Return.create({
      return_number: generateReturnNumber(),
      sale_id: data.sale_id || undefined,
      order_id: data.order_id || undefined,
      pos_customer_id: data.pos_customer_id || undefined,
      customer_id: data.customer_id || undefined,
      items: returnItems,
      total_refund: totalRefund,
      reason: data.reason,
      refund_method: data.refund_method,
      store_credit_issued: data.store_credit_issued,
      status: 'completed',
      admin_id: req.userId,
    });

    // Restock inventory products
    for (const item of returnItems) {
      const product = await Product.findById(item.product_id);
      if (!product) continue;
      const isInventory = (product as any).product_type !== 'non_inventory' && (product as any).product_type !== 'service';
      if (isInventory) {
        await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_quantity: item.quantity } });
        await StockMovement.create({
          product_id: item.product_id,
          movement_type: 'return',
          quantity_change: item.quantity,
          reference_type: 'return',
          reference_id: returnDoc._id,
          admin_id: req.userId,
          notes: item.reason,
        });
      }
    }

    // Optionally update customer outstanding balance (credit) if store credit issued
    if (data.store_credit_issued && data.pos_customer_id) {
      await Customer.findByIdAndUpdate(data.pos_customer_id, {
        $inc: { outstanding_balance: -(data.store_credit_issued as number) },
      });
    }

    res.status(201).json({
      id: returnDoc._id.toString(),
      return_number: returnDoc.return_number,
      total_refund: returnDoc.total_refund,
      status: returnDoc.status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.errors.map((e: any) => e.message).join('; ') || 'Validation failed';
      return res.status(400).json({ error: msg });
    }
    console.error('Create return error:', error);
    res.status(500).json({ error: 'Failed to create return' });
  }
});

export default router;
