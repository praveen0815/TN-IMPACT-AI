import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Supplier, Alert } from '../types';
import { ShieldAlert, MapPin, AlertTriangle, Info } from 'lucide-react';

// Fix for default marker icons in React Leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const RiskMap = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          axios.get('/api/suppliers'),
          axios.get('/api/alerts')
        ]);
        setSuppliers(sRes.data);
        setAlerts(aRes.data);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchData();
  }, []);

  const getRiskColor = (score: number) => {
    if (score < 30) return '#10b981'; // Green
    if (score < 70) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const createCustomIcon = (color: string, hasAlerts: boolean) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px ${color};
          position: relative;
        ">
          ${hasAlerts ? `
            <div style="
              position: absolute;
              top: -10px;
              right: -10px;
              background: white;
              border-radius: 50%;
              padding: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -10]
    });
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Global Disruption Heatmap</h2>
          <p className="text-slate-400">Real-time visualization of supply chain nodes and environmental risks.</p>
        </div>
        <div className="flex items-center gap-6 bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-400">Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-slate-400">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-xs font-medium text-slate-400">Severe Risk</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative z-10">
          <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {suppliers.map((supplier) => {
              const riskScore = 100 - supplier.reliability_score;
              const color = getRiskColor(riskScore);
              const supplierAlerts = alerts.filter(a => a.supplier_id === supplier.id);
              const hasAlerts = supplierAlerts.length > 0;
              
              return (
                <React.Fragment key={supplier.id}>
                  <Circle 
                    center={[supplier.lat, supplier.lng]}
                    radius={300000}
                    pathOptions={{ 
                      fillColor: color, 
                      fillOpacity: 0.15, 
                      color: color,
                      weight: 2,
                      opacity: 0.6
                    }}
                  />
                  <Marker 
                    position={[supplier.lat, supplier.lng]}
                    icon={createCustomIcon(color, hasAlerts)}
                    eventHandlers={{
                      click: () => setSelectedSupplier(supplier),
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1 min-w-[200px]">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900">{supplier.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            riskScore < 30 ? 'bg-emerald-100 text-emerald-700' :
                            riskScore < 70 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            Risk: {riskScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                          <MapPin size={12} />
                          {supplier.location}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-slate-100 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Reliability</p>
                            <p className="text-sm font-bold text-slate-900">{supplier.reliability_score}%</p>
                          </div>
                          <div className="bg-slate-100 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Lead Time</p>
                            <p className="text-sm font-bold text-slate-900">{supplier.lead_time}d</p>
                          </div>
                        </div>
                        <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors">
                          View Supplier Profile
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <ShieldAlert className="text-emerald-500" size={18} />
              Active Risk Zones
            </h3>
            <div className="space-y-4">
              {alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      alert.severity === 'Critical' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {alert.severity}
                    </span>
                    <AlertTriangle size={14} className="text-slate-500 group-hover:text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-bold mb-1">{alert.type}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Info size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-emerald-500">ML Insight</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Based on current weather patterns in SE Asia, we predict a 15% increase in lead times for electronics components over the next 14 days.
            </p>
            <button className="mt-4 w-full py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-500 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition-colors">
              Read Full Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMap;
