import React, { useState } from 'react';
import { Play, ShieldAlert, TrendingDown, Clock, DollarSign, RefreshCw, Network, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';

const SimulationPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [scenario, setScenario] = useState('Supplier Shutdown');

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/simulations/run', {
        scenario,
        baseDelay: scenario === 'Supplier Shutdown' ? 14 : 7,
        baseImpact: 250000
      });
      setResult(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Digital Twin Simulation</h2>
          <p className="text-slate-400">Stress test your supply chain network using Monte Carlo engines.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option>Supplier Shutdown</option>
            <option>Port Closure</option>
            <option>Transport Strike</option>
            <option>Demand Spike</option>
          </select>
          <button 
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
            Run 10,000 Iterations
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-600">
            <Network size={40} />
          </div>
          <h3 className="text-xl font-bold mb-2">Ready for Simulation</h3>
          <p className="text-slate-500 max-w-md">Select a disruption scenario and run the Monte Carlo engine to predict financial and operational impacts.</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Metrics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Simulation Summary</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Stockout Probability</p>
                    <p className="text-xl font-bold">{result.stockoutProbability.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expected Delay</p>
                    <p className="text-xl font-bold">{result.expectedDelay.toFixed(1)} Days</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Financial Impact</p>
                    <p className="text-xl font-bold">${result.financialImpact.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-xl shadow-emerald-900/20">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} />
                <h3 className="font-bold">AI Recommendation</h3>
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
                Based on the {result.stockoutProbability.toFixed(0)}% stockout risk, we recommend increasing safety stock by 25% at the Singapore hub and activating secondary logistics routes via Vietnam.
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="font-bold mb-6">Impact Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Min', val: result.expectedDelay * 0.5 },
                    { name: 'Avg', val: result.expectedDelay },
                    { name: 'Max', val: result.expectedDelay * 2.5 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                    <Bar dataKey="val" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
