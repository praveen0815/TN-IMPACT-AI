import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertCircle, 
  TrendingUp, 
  Box, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';
import { Supplier, Alert, DashboardMetrics } from '../types';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useRealTime } from '../context/RealTimeContext';
import { Radio } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold tracking-tight">{value}</p>
  </div>
);

const Dashboard = () => {
  const { alerts: realTimeAlerts, suppliers, inventory, metrics } = useRealTime();
  const loading = !metrics;

  const riskDistribution = [
    { name: 'Low', value: 45, color: '#10b981' },
    { name: 'Medium', value: 35, color: '#f59e0b' },
    { name: 'High', value: 20, color: '#ef4444' },
  ];

  const trendData = [
    { name: 'Mon', risk: 42 },
    { name: 'Tue', risk: 38 },
    { name: 'Wed', risk: 45 },
    { name: 'Thu', risk: 52 },
    { name: 'Fri', risk: 48 },
    { name: 'Sat', risk: 40 },
    { name: 'Sun', risk: 42 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <RefreshCw className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Executive Overview</h2>
          <p className="text-slate-400">Real-time risk intelligence and supply chain health monitoring.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">
            Run Simulation
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Suppliers" 
          value={metrics?.totalSuppliers} 
          icon={Users} 
          trend="up" 
          trendValue="+2.4%" 
          color="emerald"
        />
        <StatCard 
          title="Active Disruptions" 
          value={metrics?.activeAlerts} 
          icon={AlertCircle} 
          trend="down" 
          trendValue="-12%" 
          color="rose"
        />
        <StatCard 
          title="Avg Risk Score" 
          value={metrics?.avgRiskScore} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="+5.2" 
          color="amber"
        />
        <StatCard 
          title="Inventory Health" 
          value={metrics?.inventoryHealth} 
          icon={Box} 
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Global Risk Trend</h3>
            <select className="bg-slate-800 border-none rounded-lg text-xs px-3 py-1.5 focus:ring-1 focus:ring-emerald-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#10b981" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6">Risk Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {riskDistribution.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name} Risk</span>
                </div>
                <span className="font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg">Critical Disruption Alerts</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Radio size={10} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <Link to="/alerts" className="text-emerald-500 text-sm font-medium hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Alert Type</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {realTimeAlerts.slice(0, 5).map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors relative group">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    {new Date(alert.timestamp).getTime() > Date.now() - 60000 && (
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                    {alert.type}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                      alert.severity === 'High' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{alert.location}</td>
                  <td className="px-6 py-4 text-slate-300 text-sm max-w-xs truncate">{alert.description}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{format(new Date(alert.timestamp), 'MMM d, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
