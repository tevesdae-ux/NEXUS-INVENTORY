import React, { useMemo } from 'react';
import { Product, Transaction } from '../types';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Package, AlertTriangle, TrendingUp, DollarSign, Wifi, Wallet, ArrowRight } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  onViewLowStock: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC<DashboardProps> = ({ products, transactions, onViewLowStock }) => {
  
  const stats = useMemo(() => {
    const totalItems = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
    const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.minLevel || 0)).length;
    
    // Calculate Accurate Total Cost (Valuation) based on Batches
    const totalCost = products.reduce((acc, p) => {
        if (p.batches && p.batches.length > 0) {
            // Sum cost of all batches
            return acc + p.batches.reduce((bSum, b) => bSum + ((b.quantity || 0) * (b.unitCost || 0)), 0);
        }
        // Fallback if no batches
        return acc + ((p.cost || 0) * (p.quantity || 0));
    }, 0);

    const totalRevenue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.quantity || 0)), 0);
    const totalProfit = totalRevenue - totalCost;
    
    return { totalItems, lowStockCount, totalRevenue, totalProfit, totalCost };
  }, [products]);

  const categoryMetrics = useMemo(() => {
    const metrics: Record<string, { quantity: number, value: number, cost: number, count: number }> = {};
    
    products.forEach(p => {
      if (!metrics[p.category]) {
        metrics[p.category] = { quantity: 0, value: 0, cost: 0, count: 0 };
      }
      
      // Calculate specific product cost for category aggregation
      let productTotalCost = 0;
      if (p.batches && p.batches.length > 0) {
          productTotalCost = p.batches.reduce((sum, b) => sum + ((b.quantity || 0) * (b.unitCost || 0)), 0);
      } else {
          productTotalCost = (p.quantity || 0) * (p.cost || 0);
      }

      metrics[p.category].quantity += (p.quantity || 0);
      metrics[p.category].value += (p.price || 0) * (p.quantity || 0);
      metrics[p.category].cost += productTotalCost;
      metrics[p.category].count += 1;
    });

    return Object.entries(metrics).map(([name, data]) => ({
      name,
      ...data,
      profit: data.value - data.cost
    })).sort((a, b) => b.value - a.value);
  }, [products]);

  const pieData = useMemo(() => categoryMetrics.map(c => ({ name: c.name, value: c.quantity })), [categoryMetrics]);

  const recentActivity = transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Inventory</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalItems}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Inventory Value (Cost)</p>
              <h3 className="text-2xl font-bold text-slate-900">₱{(stats.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Potential Profit</p>
              <h3 className="text-2xl font-bold text-indigo-600">₱{(stats.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div 
            onClick={onViewLowStock}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-red-100 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-red-600 transition-colors">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.lowStockCount}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-10 transition-opacity" />
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={16} className="text-red-400" />
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">Inventory by Category</h4>
            <p className="text-xs sm:text-sm text-slate-500">Detailed breakdown of stock, cost, and profit</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-500 whitespace-nowrap">
             <Wifi size={12} className="text-emerald-500" />
             <span className="hidden sm:inline">Live Updates Active</span>
             <span className="sm:hidden">Live</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Category</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Products</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Stock Qty</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Total Cost</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Total Value</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Profit Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryMetrics.map((cat) => (
                <tr key={cat.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-600">{cat.count}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-600">{cat.quantity}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-600">₱{(cat.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-600">₱{(cat.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-emerald-600">+₱{(cat.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="text-lg font-semibold mb-4 text-slate-800">Stock Distribution</h4>
          <div className="h-64 w-full relative min-h-0">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="99%" height="99%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No data available</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="text-lg font-semibold mb-4 text-slate-800">Recent Activity</h4>
          <div className="space-y-4">
            {recentActivity.length === 0 && <p className="text-slate-500 text-sm">No recent transactions.</p>}
            {recentActivity.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {t.type}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{t.productName}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()} • {t.user}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'IN' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {t.type === 'IN' ? '+' : '-'}{t.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};