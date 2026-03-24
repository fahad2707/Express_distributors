import express from 'express';
import { authenticateAdmin, AuthRequest } from '../../../middleware/auth';
import {
  getFinancialOverview,
  getRevenueVsExpensesByMonth,
  getMonthlyNetProfit,
  getExpenseBreakdownByCategory,
  getFixedVsVariableExpenses,
} from '../services/financialReportService';

const router = express.Router();

function parseDateRange(period: string, start?: string, end?: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  if (start && end && typeof start === 'string' && typeof end === 'string') {
    return { startDate: new Date(start), endDate: new Date(end) };
  }
  if (period === 'this_month') {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(),
    };
  }
  if (period === 'last_month') {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth(), 0),
    };
  }
  const days = Math.min(parseInt(period as string) || 365, 730);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate: new Date() };
}

// Financial overview (cards)
router.get('/financial-overview', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = 'this_month', start, end } = req.query;
    const { startDate, endDate } = parseDateRange(period as string, start as string, end as string);
    const overview = await getFinancialOverview(startDate, endDate);
    res.json({ ...overview, startDate, endDate });
  } catch (e) {
    console.error('Financial overview:', e);
    res.status(500).json({ error: 'Failed to get financial overview' });
  }
});

// Revenue vs Expenses (bar chart)
router.get('/revenue-vs-expenses', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = 'this_month', start, end } = req.query;
    const { startDate, endDate } = parseDateRange(period as string, start as string, end as string);
    const data = await getRevenueVsExpensesByMonth(startDate, endDate);
    res.json({ data, startDate, endDate });
  } catch (e) {
    console.error('Revenue vs expenses:', e);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// Monthly net profit (line chart)
router.get('/monthly-net-profit', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = 'this_month', start, end } = req.query;
    const { startDate, endDate } = parseDateRange(period as string, start as string, end as string);
    const data = await getMonthlyNetProfit(startDate, endDate);
    res.json({ data, startDate, endDate });
  } catch (e) {
    console.error('Monthly net profit:', e);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// Expense breakdown by category (donut)
router.get('/expense-breakdown', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = 'this_month', start, end } = req.query;
    const { startDate, endDate } = parseDateRange(period as string, start as string, end as string);
    const data = await getExpenseBreakdownByCategory(startDate, endDate);
    res.json({ data, startDate, endDate });
  } catch (e) {
    console.error('Expense breakdown:', e);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// Fixed vs variable (comparison)
router.get('/fixed-vs-variable-expenses', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = 'this_month', start, end } = req.query;
    const { startDate, endDate } = parseDateRange(period as string, start as string, end as string);
    const data = await getFixedVsVariableExpenses(startDate, endDate);
    res.json({ data, startDate, endDate });
  } catch (e) {
    console.error('Fixed vs variable:', e);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

export default router;
