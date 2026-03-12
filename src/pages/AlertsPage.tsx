import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert } from '../types';
import { AlertTriangle, Filter, Search, Download, Clock, MapPin, Brain, Loader2, Radio } from 'lucide-react';
import { format } from 'date-fns';
import Markdown from 'react-markdown';
import { generateAIContent } from '../services/gemini';
import { useRealTime } from '../context/RealTimeContext';

const AlertsPage = () => {
  const { alerts: realTimeAlerts } = useRealTime();
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<Record<number, string>>({});
  const [analyzing, setAnalyzing] = useState<Record<number, boolean>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000); // Update every 10 seconds to re-evaluate "newness"
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAnalyze = async (alert: Alert) => {
    if (analyzing[alert.id]) return;

    setAnalyzing(prev => ({ ...prev, [alert.id]: true }));
    try {
      const result = await generateAIContent(
        `Analyze this supply chain alert: "${alert.type}" in "${alert.location}". 
        Description: ${alert.description}. 
        Provide potential impacts and specific mitigation strategies.`,
        alert
      );
      setAnalyses(prev => ({ ...prev, [alert.id]: result.text }));
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setAnalyses(prev => ({ ...prev, [alert.id]: `Failed to generate analysis: ${error.message || 'Please check your AI configuration.'}` }));
    } finally {
      setAnalyzing(prev => ({ ...prev, [alert.id]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-3xl font-bold tracking-tight">Disruption Intelligence</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Radio size={10} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live Feed</span>
            </div>
          </div>
          <p className="text-slate-400">Real-time monitoring of global supply chain disruptions.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search alerts..." 
              className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 w-64"
            />
          </div>
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100">
            <Filter size={20} />
          </button>
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {realTimeAlerts.map((alert) => {
          const isNew = new Date(alert.timestamp).getTime() > now - 60000;
          
          return (
            <div 
              key={alert.id} 
              className={`bg-slate-900 border p-6 rounded-2xl transition-all flex flex-col gap-6 relative overflow-hidden group ${
                isNew ? 'animate-alert-glow border-emerald-500/50' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* New Alert Indicator */}
              {isNew && (
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              )}
            
            <div className="flex gap-6">
              <div className={`p-4 rounded-xl h-fit ${
                alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                alert.severity === 'High' ? 'bg-amber-500/10 text-amber-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{alert.type}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {alert.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                    alert.severity === 'High' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {alert.severity} Severity
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {alert.description}
                </p>
                
                {analyses[alert.id] && (
                  <div className="mb-6 p-4 bg-slate-800/50 border border-emerald-500/20 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase mb-3">
                      <Brain size={14} />
                      AI Impact Analysis
                    </div>
                    <div className="text-slate-300 text-sm prose prose-invert prose-sm max-w-none">
                      <Markdown>{analyses[alert.id]}</Markdown>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAnalyze(alert)}
                    disabled={analyzing[alert.id]}
                    className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing[alert.id] ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                    {analyses[alert.id] ? 'Re-analyze Impact' : 'Analyze Impact'}
                  </button>
                  <button className="px-4 py-1.5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold hover:bg-emerald-600/20 transition-colors">
                    Mitigation Strategy
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
