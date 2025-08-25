export type DeviceType = 'cctv' | 'smart_bulb' | 'thermostat' | 'door_lock' | 'ip_camera';

export type SimulationEventType = 'info' | 'warning' | 'alert' | 'attack' | 'defense' | 'compromise' | 'tampering' | 'risk_change' | 'system';

export interface DeviceMetrics {
  cpu: number;
  mem: number;
  netIn: number;
  netOut: number;
  battery?: number;
  msgRate?: number;
  failedAuth?: number;
  timestamp?: number;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  firmwareVersion: string;
  weakPassword: boolean;
  openPorts: number[];
  compromised: boolean;
  integrityRisk: boolean;
  riskScore: number;
  lastEvent: SimulationEvent | null;
  metrics: DeviceMetrics;
  lastUpdated: number;
}

export interface AttackState {
  synFlood: number; // 0-100
  dictionaryAttack: number; // 0-100
  mqttFlood: number; // 0-100
  firmwareTamper: boolean;
  isActive: boolean;
  targetDeviceId: string | null;
  attackType: string | null;
  intensity: number;
  isSuccessful: boolean;
  lastAttempt: number | null;
}

export interface DefenseState {
  isActive: boolean;
  firewallEnabled: boolean;
  encryptionEnabled: boolean;
  rateLimitingEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  lastUpdated: number;
  defenseLevel: 'low' | 'medium' | 'high';
  autoMitigation: boolean;
  blockMaliciousIPs: boolean;
  logMonitoring: boolean;
}

export interface SimulationState {
  running: boolean;
  tickInterval: number;
  devices: Device[];
  attack: AttackState;
  defense: DefenseState;
  lastUpdated: number;
  startedAt: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  deviceId: string;
  deviceName?: string;
  type: SimulationEventType;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  setup: (state: SimulationState) => void;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface StoreState extends SimulationState {
  setState: (state: SimulationState) => void;
  addEvent: (event: Omit<SimulationEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  setSelectedDevice: (deviceId: string | null) => void;
  startSimulation: (scenarioId: string) => void;
  stopSimulation: () => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  updateAttack: (updates: Partial<AttackState>) => void;
  updateDefense: (updates: Partial<DefenseState>) => void;
  events: SimulationEvent[];
  selectedDeviceId: string | null;
  currentScenario: string | null;
  socket?: WebSocket | null;
}
