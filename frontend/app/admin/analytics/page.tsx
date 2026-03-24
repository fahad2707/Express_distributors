'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import adminApi from '@/lib/admin-api';
import toast from 'react-hot-toast';
import { FileDown, FileText, DollarSign, TrendingDown, TrendingUp, Wallet, Percent } from 'lucide-react';

interface SalesData {
  date: string;
  revenue: number;
  orders?: number;
  sales?: number;
}

interface CategorySales {
  category: string;
  revenue: number;
  quantity: number;
}

interface FinancialOverview {
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  total_expenses: number;
  net_profit: number;
  expense_percent_of_revenue: number;
  profit_margin_percent: number;
}

const CHART_COLORS = ['#0f766e', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [period, setPeriod] = useState('30');
  const [reportPeriod, setReportPeriod] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState<{ month: string; revenue: number; expenses: number }[]>([]);
  const [monthlyNetProfit, setMonthlyNetProfit] = useState<{ month: string; net_profit: number }[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [fixedVsVariable, setFixedVsVariable] = useState<{ fixed: number; variable: number }>({ fixed: 0, variable: 0 });

  const reportParams = () => {
    if (reportPeriod === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    return { period: reportPeriod };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  useEffect(() => {
    fetchFinancialReports();
  }, [reportPeriod, customStart, customEnd]);

  const fetchAnalytics = async () => {
    try {
      const salesResponse = await adminApi.get('/analytics/sales', { params: { period, groupBy: 'day' } });
      const onlineMap = new Map((salesResponse.data.onlineSales || []).map((s: SalesData) => [s.date, s.revenue || 0]));
      const offlineMap = new Map((salesResponse.data.offlineSales || []).map((s: SalesData) => [s.date, s.revenue || 0]));
      const allDates = new Set([
        ...(salesResponse.data.onlineSales || []).map((s: SalesData) => s.date),
        ...(salesResponse.data.offlineSales || []).map((s: SalesData) => s.date),
      ]);
      const combined: SalesData[] = Array.from(allDates).map((date) => {
        const o = onlineMap.get(date);
        const f = offlineMap.get(date);
        return {
          date,
          revenue: (typeof o === 'number' ? o : 0) + (typeof f === 'number' ? f : 0),
        };
      });
      setSalesData(combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setCategorySales(salesResponse.data.categorySales || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialReports = async () => {
    try {
      const params = reportParams();
      const [overview, revVsExp, netProfit, breakdown, fixedVar] = await Promise.all([
        adminApi.get('/reports/financial-overview', { params }),
        adminApi.get('/reports/revenue-vs-expenses', { params }),
        adminApi.get('/reports/monthly-net-profit', { params }),
        adminApi.get('/reports/expense-breakdown', { params }),
        adminApi.get('/reports/fixed-vs-variable-expenses', { params }),
      ]);
      setFinancialOverview(overview.data);
      setRevenueVsExpenses(revVsExp.data.data || []);
      setMonthlyNetProfit(netProfit.data.data || []);
      setExpenseBreakdown(breakdown.data.data || []);
      setFixedVsVariable(fixedVar.data.data || { fixed: 0, variable: 0 });
    } catch (e: any) {
      console.error('Financial reports:', e);
      setFinancialOverview(null);
      setRevenueVsExpenses([]);
      setMonthlyNetProfit([]);
      setExpenseBreakdown([]);
    }
  };

  const handleExportCSV = () => {
    if (!financialOverview) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', String(financialOverview.total_revenue)],
      ['Total COGS', String(financialOverview.total_cogs)],
      ['Gross Profit', String(financialOverview.gross_profit)],
      ['Total Expenses', String(financialOverview.total_expenses)],
      ['Net Profit', String(financialOverview.net_profit)],
      ['Expense % of Revenue', String(financialOverview.expense_percent_of_revenue) + '%'],
      ['Profit Margin %', String(financialOverview.profit_margin_percent) + '%'],
    ];
    downloadCSV(`financial-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('CSV downloaded');
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
          {reportPeriod === 'custom' && (
            <>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            </>
          )}
          <button onClick={handleExportCSV} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
            <FileText className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">{financialOverview ? Number(financialOverview.total_revenue).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total COGS</p>
                <p className="text-lg font-bold text-gray-900">{financialOverview ? Number(financialOverview.total_cogs).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gross Profit</p>
                <p className="text-lg font-bold text-gray-900">{financialOverview ? Number(financialOverview.gross_profit).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-lg font-bold text-gray-900">{financialOverview ? Number(financialOverview.total_expenses).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0f766e]/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-[#0f766e]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Profit</p>
                <p className={`text-lg font-bold ${financialOverview && financialOverview.net_profit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {financialOverview ? Number(financialOverview.net_profit).toLocaleString() : '—'}
                </p>
                {financialOverview && (
                  <p className="text-xs text-gray-500">
                    Margin: {financialOverview.profit_margin_percent}% · Expense % of revenue: {financialOverview.expense_percent_of_revenue}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue vs Expenses (Bar)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#0f766e" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Net Profit (Line)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyNetProfit}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="net_profit" stroke="#0f766e" strokeWidth={2} name="Net Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Expense Breakdown by Category (Donut)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {expenseBreakdown.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [Number(v).toLocaleString(), 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Fixed vs Variable Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                { name: 'Fixed', amount: fixedVsVariable.fixed, fill: '#3b82f6' },
                { name: 'Variable', amount: fixedVsVariable.variable, fill: '#f59e0b' },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Original Revenue & Category Sales */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Sales Analytics</h2>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#0f766e] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Sales by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categorySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Category Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-700">Category</th>
                    <th className="text-right py-3 px-4 text-gray-700">Revenue</th>
                    <th className="text-right py-3 px-4 text-gray-700">Quantity Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySales.map((cat, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{cat.category || 'Uncategorized'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {parseFloat(cat.revenue.toString()).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{cat.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
