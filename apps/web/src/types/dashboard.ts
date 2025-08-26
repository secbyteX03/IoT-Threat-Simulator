export interface ThreatMetric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatCategory {
  id: string;
  name: string;
  count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ThreatActivity {
  id: string;
  timestamp: number;
  type: string;
  deviceId: string;
  deviceName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  sourceIp?: string;
  targetPort?: number;
  protocol?: string;
}

export interface ThreatIntelData {
  metrics: ThreatMetric[];
  categories: ThreatCategory[];
  recentActivities: ThreatActivity[];
  devicesAtRisk: number;
  totalThreats: number;
  lastUpdated: number;
}

export interface DashboardState {
  isOpen: boolean;
  selectedMetric?: string;
  timeRange: '1h' | '24h' | '7d' | '30d';
  isLoading: boolean;
  error: string | null;
  data: ThreatIntelData;
}
