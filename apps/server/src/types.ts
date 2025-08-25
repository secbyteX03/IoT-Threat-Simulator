export type DeviceType = 'cctv' | 'smart_bulb' | 'thermostat' | 'door_lock' | 'ip_camera';

export type SimulationEventType = 'info' | 'warning' | 'alert' | 'attack' | 'defense' | 'compromise' | 'tampering' | 'risk_change';

export interface DeviceMetrics {
  cpu: number;
  mem: number;
  netIn: number;
  netOut: number;
  battery?: number;
  msgRate?: number;
  failedAuth?: number;
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
}

export interface DefenseState {
  rateLimiting: boolean;
  accountLockout: boolean;
  signatureCheck: boolean;
}

export interface SimulationState {
  running: boolean;
  tickInterval: number;
  devices: Device[];
  attack: AttackState;
  defense: DefenseState;
  lastUpdated: number;
  startedAt: number;
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  deviceId: string;
  deviceName?: string;
  type: SimulationEventType;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  message: string;
  details?: Record<string, unknown>;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  setup: (state: SimulationState) => void;
}
