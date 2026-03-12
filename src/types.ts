export interface Supplier {
  id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  reliability_score: number;
  lead_time: number;
  category: string;
  risk_score?: number;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  location: string;
  description: string;
  timestamp: string;
  supplier_id?: number;
}

export interface InventoryItem {
  id: number;
  product_name: string;
  stock_level: number;
  safety_stock: number;
  warehouse_location: string;
}

export interface DashboardMetrics {
  totalSuppliers: number;
  activeAlerts: number;
  avgRiskScore: number;
  inventoryHealth: string;
}
