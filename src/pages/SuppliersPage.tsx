import React, { useState, useMemo } from 'react';
import { useRealTime } from '../context/RealTimeContext';
import { Users, Star, Clock, MapPin, ShieldCheck, ExternalLink, Search, AlertTriangle, ArrowUpDown, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const SuppliersPage = () => {
  const { suppliers, alerts } = useRealTime();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'reliability' | 'alerts'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [locationFilter, setLocationFilter] = useState('All');
  const [alertFilter, setAlertFilter] = useState<'All' | 'With Alerts' | 'Critical'>('All');

  const getSupplierAlerts = (supplierId: number) => {
    return alerts.filter(alert => alert.supplier_id === supplierId);
  };

  const locations = useMemo(() => {
    const locs = Array.from(new Set(suppliers.map(s => s.location)));
    return ['All', ...locs.sort()];
  }, [suppliers]);

  const filteredAndSortedSuppliers = useMemo(() => {
    let result = [...suppliers];

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.location.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    // Location Filter
    if (locationFilter !== 'All') {
      result = result.filter(s => s.location === locationFilter);
    }

    // Alert Filter
    if (alertFilter !== 'All') {
      result = result.filter(s => {
        const sAlerts = getSupplierAlerts(s.id);
        if (alertFilter === 'With Alerts') return sAlerts.length > 0;
        if (alertFilter === 'Critical') return sAlerts.some(a => a.severity === 'Critical');
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'reliability') {
        comparison = a.reliability_score - b.reliability_score;
      } else if (sortBy === 'alerts') {
        comparison = getSupplierAlerts(a.id).length - getSupplierAlerts(b.id).length;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [suppliers, alerts, searchQuery, sortBy, sortOrder, locationFilter, alertFilter]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Supplier Network</h2>
          <p className="text-slate-400">Comprehensive directory and performance metrics of global partners.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 text-slate-300"
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc === 'All' ? 'All Locations' : loc}</option>
              ))}
            </select>

            <select 
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 text-slate-300"
            >
              <option value="All">All Status</option>
              <option value="With Alerts">With Alerts</option>
              <option value="Critical">Critical Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pb-2 border-b border-slate-800">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort By:</span>
        <button 
          onClick={() => toggleSort('name')}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${sortBy === 'name' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Name
          {sortBy === 'name' && <ArrowUpDown size={12} className={sortOrder === 'desc' ? 'rotate-180' : ''} />}
        </button>
        <button 
          onClick={() => toggleSort('reliability')}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${sortBy === 'reliability' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Reliability
          {sortBy === 'reliability' && <ArrowUpDown size={12} className={sortOrder === 'desc' ? 'rotate-180' : ''} />}
        </button>
        <button 
          onClick={() => toggleSort('alerts')}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${sortBy === 'alerts' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Alerts
          {sortBy === 'alerts' && <ArrowUpDown size={12} className={sortOrder === 'desc' ? 'rotate-180' : ''} />}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredAndSortedSuppliers.length > 0 ? (
          filteredAndSortedSuppliers.map((supplier) => {
            const supplierAlerts = getSupplierAlerts(supplier.id);
            const hasHighSeverityAlert = supplierAlerts.some(a => a.severity === 'Critical' || a.severity === 'High');
            
            return (
              <div key={supplier.id} className={`bg-slate-900 border ${hasHighSeverityAlert ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-slate-800'} p-6 rounded-2xl hover:border-slate-700 transition-all group flex flex-col relative overflow-hidden`}>
                {hasHighSeverityAlert && (
                  <div className="absolute top-0 right-0 p-2">
                    <AlertTriangle className="text-rose-500 animate-pulse" size={20} />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${hasHighSeverityAlert ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-emerald-500'} rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all`}>
                      <Users size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold group-hover:text-emerald-500 transition-colors">{supplier.name}</h3>
                        {supplierAlerts.length > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${hasHighSeverityAlert ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {supplierAlerts.length} {supplierAlerts.length === 1 ? 'Alert' : 'Alerts'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin size={14} />
                        {supplier.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                      <Star size={16} fill="currentColor" />
                      {supplier.reliability_score / 20}
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{supplier.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1">
                      <ShieldCheck size={12} />
                      Reliability
                    </div>
                    <p className="text-lg font-bold">{supplier.reliability_score}%</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1">
                      <Clock size={12} />
                      Lead Time
                    </div>
                    <p className="text-lg font-bold">{supplier.lead_time} Days</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1">
                      <ExternalLink size={12} />
                      Status
                    </div>
                    <p className="text-lg font-bold text-emerald-500">Active</p>
                  </div>
                </div>

                {supplierAlerts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      Active Disruptions
                    </h4>
                    <div className="space-y-2">
                      {supplierAlerts.map(alert => (
                        <Link 
                          key={alert.id} 
                          to="/alerts"
                          className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl hover:bg-rose-500/10 transition-colors group/alert"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              alert.severity === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            <span className="text-sm font-medium text-slate-200">{alert.type}</span>
                          </div>
                          <ExternalLink size={14} className="text-slate-600 group-hover/alert:text-rose-500 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex gap-3">
                  <button className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors">
                    Performance Analytics
                  </button>
                  <button className="flex-1 py-2.5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600/20 rounded-xl text-sm font-bold transition-colors">
                    Risk Assessment
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-900 border border-dashed border-slate-800 rounded-3xl">
            <Users className="mx-auto text-slate-700 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-300 mb-2">No suppliers found</h3>
            <p className="text-slate-500">Try adjusting your filters or search query.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('All');
                setAlertFilter('All');
              }}
              className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersPage;
