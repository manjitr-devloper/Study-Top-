import React from 'react';
import { 
  CreditCard, 
  Download, 
  CheckCircle, 
  Clock, 
  FileText, 
  ShieldCheck,
  Receipt
} from 'lucide-react';

interface TransactionItem {
  id: string;
  orderId: string;
  date: string;
  amount: string;
  method: string;
  plan: string;
  couponUsed: string;
  status: 'Completed' | 'Pending' | 'Refunded';
}

export const PaymentHistoryPage: React.FC = () => {
  const transactions: TransactionItem[] = [
    {
      id: 'TXN_982341823',
      orderId: 'ORDER_ST_20261015',
      date: 'Oct 15, 2026',
      amount: '₹199.00',
      method: 'UPI / Razorpay',
      plan: 'Student Pro Scholar (Monthly)',
      couponUsed: 'None',
      status: 'Completed'
    },
    {
      id: 'TXN_781290341',
      orderId: 'ORDER_ST_20260915',
      date: 'Sep 15, 2026',
      amount: '₹99.50',
      method: 'UPI / Razorpay',
      plan: 'Student Pro Scholar (Monthly)',
      couponUsed: 'STUDENT50 (50% Off)',
      status: 'Completed'
    },
    {
      id: 'TXN_120938402',
      orderId: 'ORDER_ST_20260808',
      date: 'Aug 08, 2026',
      amount: '₹20.00',
      method: 'Card Payment',
      plan: 'Starter Trial Plan (7 Days)',
      couponUsed: 'None',
      status: 'Completed'
    }
  ];

  const handleDownloadInvoice = (txn: TransactionItem) => {
    const invoiceContent = `================================================
           STUDY TOP OFFICIAL RECEIPT
       Created by Manjit Ranjan (Google Developer)
================================================
Transaction ID: ${txn.id}
Order Reference: ${txn.orderId}
Date: ${txn.date}
Purchased Plan: ${txn.plan}
Payment Method: ${txn.method}
Discount Applied: ${txn.couponUsed}
Total Amount Paid: ${txn.amount}
Payment Status: ${txn.status}
================================================
Thank you for learning with Study Top!
================================================`;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${txn.id}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
            Invoices &amp; Receipts
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Payment &amp; Billing History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Download verified tax invoices and track all subscription transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit Encrypted Payments</span>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Order History ({transactions.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {transactions.map(txn => (
            <div key={txn.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 truncate">{txn.plan}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                    {txn.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span className="font-mono text-slate-600 font-bold">{txn.id}</span>
                  <span>•</span>
                  <span>{txn.date}</span>
                  <span>•</span>
                  <span>{txn.method}</span>
                  {txn.couponUsed !== 'None' && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 font-bold">{txn.couponUsed}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="text-base font-black text-slate-900">{txn.amount}</span>

                <button
                  onClick={() => handleDownloadInvoice(txn)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition border border-slate-200"
                  title="Download verified receipt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
