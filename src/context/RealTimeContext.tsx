import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Alert, Supplier, InventoryItem, DashboardMetrics } from '../types';
import axios from 'axios';

interface RealTimeContextType {
  alerts: Alert[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  metrics: DashboardMetrics | null;
  newAlertCount: number;
  clearNewAlertCount: () => void;
  isConnected: boolean;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, sRes, iRes, mRes] = await Promise.all([
          axios.get('/api/alerts'),
          axios.get('/api/suppliers'),
          axios.get('/api/inventory'),
          axios.get('/api/dashboard/metrics')
        ]);
        setAlerts(aRes.data);
        setSuppliers(sRes.data);
        setInventory(iRes.data);
        setMetrics(mRes.data);
      } catch (error) {
        console.error('Initial fetch failed:', error);
      }
    };
    fetchData();

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Real-time connection established');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new_alert', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev]);
      setNewAlertCount(prev => prev + 1);
      
      if (Notification.permission === 'granted') {
        new Notification(`New Disruption: ${alert.type}`, {
          body: `${alert.severity} severity disruption in ${alert.location}`,
        });
      }
    });

    newSocket.on('inventory_update', (item: InventoryItem) => {
      setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    });

    newSocket.on('supplier_update', (supplier: Supplier) => {
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
    });

    newSocket.on('metrics_update', (newMetrics: DashboardMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const clearNewAlertCount = useCallback(() => {
    setNewAlertCount(0);
  }, []);

  return (
    <RealTimeContext.Provider value={{ alerts, suppliers, inventory, metrics, newAlertCount, clearNewAlertCount, isConnected }}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};
