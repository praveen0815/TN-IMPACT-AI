import React, { useState, useEffect } from 'react';
import { useRealTime } from '../context/RealTimeContext';
import { Package, AlertCircle, CheckCircle2, ArrowRight, BarChart3, Warehouse } from 'lucide-react';

const InventoryPage = () => {
  const { inventory } = useRealTime();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Inventory Health</h2>
        <p className="text-slate-400">Monitoring stock levels and safety stock buffers across warehouses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {inventory.map((item) => {
          const isLow = item.stock_level < item.safety_stock;
          const healthPercent = Math.min(100, (item.stock_level / (item.safety_stock * 2)) * 100);

          return (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${isLow ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  <Package size={24} />
                </div>
                {isLow ? (
                  <div className="flex items-center gap-1 text-rose-500 text-xs font-bold uppercase">
                    <AlertCircle size={14} />
                    Critical Stock
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase">
                    <CheckCircle2 size={14} />
                    Healthy
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-1">{item.product_name}</h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                <Warehouse size={14} />
                {item.warehouse_location}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Stock Level</span>
                    <span className="font-bold">{item.stock_level.toLocaleString()} units</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${healthPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Safety Buffer</p>
                    <p className="text-sm font-bold">{item.safety_stock.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Days of Cover</p>
                    <p className="text-sm font-bold">{Math.floor(item.stock_level / 150)} Days</p>
                  </div>
                </div>

                <button className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-bold rounded-xl transition-colors">
                  <BarChart3 size={16} />
                  View Demand Forecast
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryPage;
