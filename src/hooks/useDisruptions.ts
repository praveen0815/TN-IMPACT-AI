import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Alert } from '../types';

export const useDisruptions = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to disruption feed');
    });

    newSocket.on('new_alert', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev]);
      setNewAlertCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(`New Disruption: ${alert.type}`, {
          body: `${alert.severity} severity disruption in ${alert.location}`,
          icon: '/favicon.ico'
        });
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const clearNewAlertCount = useCallback(() => {
    setNewAlertCount(0);
  }, []);

  return { alerts, setAlerts, newAlertCount, clearNewAlertCount, socket };
};
