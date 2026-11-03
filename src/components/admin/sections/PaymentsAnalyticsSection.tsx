import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, CheckCircle2, AlertCircle, Search, RefreshCw, Download, Award, ShieldCheck, TrendingUp, Users } from 'lucide-react';

interface PaymentsAnalyticsSectionProps {
  currentUser: any;
}

export const PaymentsAnalyticsSection: React.FC<PaymentsAnalyticsSectionProps> = ({ currentUser }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPaymentsData = () => {
    setLoading(true);
    const token = 'admin_session_token'; // handled via verifySuperAdmin middleware
    fetch('/api/admin/payments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.metrics);
          setPayments(data.payments || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load admin payments:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.razorpayOrderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.uid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.planId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    const headers = ['Payment ID', 'Order ID', 'UID', 'Plan ID', 'Amount (INR)', 'Status', 'Verification', 'Date'];
    const rows = filteredPayments.map(p => [
      p.razorpayPaymentId || 'N/A',
      p.razorpayOrderId,
      p.uid,
      p.planId,
      p.amount,
      p.status,
      p.verificationStatus,
      new Date(p.createdAt).toISOString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `study_top_razorpay_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>Razorpay Payment Gateway & Revenue Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">Real-time verified transactions, subscription metrics, and secure gateway logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPaymentsData}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCsv}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Verified captured payments</span>
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Successful Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.successfulCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            HMAC-SHA256 signature verified
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.activeSubscriptionsCount || 0}
          </div>
          <p className="text-[11px] text-purple-600 font-medium mt-1">
            Pro entitlements active
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed / Pending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.failedCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Dropped or pending checkouts
          </p>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by Order ID, User UID, or Plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Captured</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                <th className="py-3 px-4">Order ID / Payment ID</th>
                <th className="py-3 px-4">User UID</th>
                <th className="py-3 px-4">Plan ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-semibold text-slate-900">{p.razorpayOrderId}</div>
                    <div className="text-[10px] text-slate-400">{p.razorpayPaymentId || 'No Payment ID yet'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 truncate max-w-[120px]">
                    {p.uid}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {p.planId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{(p.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'captured' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      p.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {p.verificationStatus || 'unverified'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No payment transactions found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
