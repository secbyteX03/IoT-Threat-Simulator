import { v4 as uuidv4 } from 'uuid';
import { 
  Device, 
  DeviceMetrics, 
  DeviceType, 
  SimulationState, 
  AttackState, 
  DefenseState,
  SimulationEvent,
  SimulationEventType
} from '../types';

// Constants for simulation tuning
const METRIC_UPDATE_INTERVAL = 1000; // ms
const RISK_UPDATE_INTERVAL = 5000; // ms
const COMPROMISE_THRESHOLD = 80; // Attack success threshold (0-100)
const INTEGRITY_RISK_THRESHOLD = 70; // Firmware tampering risk threshold (0-100)
const METRIC_VARIANCE = 0.2; // 20% variance in metrics
const BASE_METRICS: Record<DeviceType, Omit<DeviceMetrics, 'timestamp'>> = {
  cctv: { cpu: 15, mem: 30, netIn: 200, netOut: 500, msgRate: 10, failedAuth: 0 },
  smart_bulb: { cpu: 5, mem: 10, netIn: 10, netOut: 5, msgRate: 2, failedAuth: 0 },
  thermostat: { cpu: 10, mem: 15, netIn: 5, netOut: 5, msgRate: 1, failedAuth: 0 },
  door_lock: { cpu: 8, mem: 12, netIn: 3, netOut: 3, msgRate: 0.5, failedAuth: 0 },
  ip_camera: { cpu: 20, mem: 40, netIn: 300, netOut: 800, msgRate: 15, failedAuth: 0 }
};

const DEVICE_TYPES: DeviceType[] = ['cctv', 'smart_bulb', 'thermostat', 'door_lock', 'ip_camera'];
const DEFAULT_PORTS: Record<DeviceType, number[]> = {
  cctv: [80, 443, 554, 8000],
  smart_bulb: [80, 443, 8080],
  thermostat: [80, 443, 3000],
  door_lock: [80, 443, 3001],
  ip_camera: [80, 443, 554, 8000, 9000]
};

export class SimulationEngine {
  private state: SimulationState;
  private tickInterval: NodeJS.Timeout | null = null;
  private eventListeners: Array<(event: SimulationEvent) => void> = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): SimulationState {
    const now = Date.now();
    return {
      running: false,
      startedAt: now,
      lastUpdated: now,
      tickInterval: 500, // ms
      devices: this.generateDevices(5),
      attack: {
        synFlood: 0,
        dictionaryAttack: 0,
        mqttFlood: 0,
        firmwareTamper: false
      },
      defense: {
        rateLimiting: false,
        accountLockout: false,
        signatureCheck: false
      },
      lastUpdated: now,
      startedAt: now
    };
  }

  private generateDevices(count: number): Device[] {
    const devices: Device[] = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const type = DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)];
      const hasBattery = Math.random() > 0.5;
      const baseMetric = { ...BASE_METRICS[type], timestamp: now };
      const device: Device = {
        id: `device-${i + 1}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} ${i + 1}`,
        type,
        firmwareVersion: '1.0.0',
        weakPassword: Math.random() > 0.7, // 30% chance of weak password
        openPorts: [...DEFAULT_PORTS[type]],
        compromised: false,
        integrityRisk: false,
        metrics: this.calculateDeviceMetrics(baseMetric, 0, false),
        lastUpdated: now,
        riskScore: 0,
        lastEvent: null
      };
      
      // Initial risk calculation
      device.riskScore = this.calculateDeviceRisk(device);
      
      devices.push(device);
    }
    
    return devices;
  }

  public start(): void {
    if (this.state.running) return;
    
    this.state.running = true;
    this.state.startedAt = Date.now();
    
    // Start the main simulation loop
    this.tickInterval = setInterval(() => this.tick(), this.state.tickInterval);
    
    // Start periodic updates
    setInterval(() => this.updateDeviceMetrics(), METRIC_UPDATE_INTERVAL);
    setInterval(() => this.updateRiskScores(), RISK_UPDATE_INTERVAL);
    
    this.emitEvent({
      id: uuidv4(),
      timestamp: Date.now(),
      deviceId: 'system',
      deviceName: 'System',
      type: 'info',
      severity: 'info',
      message: 'Simulation started'
    });
  }

  public pause(): void {
    if (!this.tickInterval) return;
    
    clearInterval(this.tickInterval);
    this.tickInterval = null;
    this.state.running = false;
    
    this.emitEvent({
      id: uuidv4(),
      timestamp: Date.now(),
      deviceId: 'system',
      deviceName: 'System',
      type: 'info',
      severity: 'info',
      message: 'Simulation paused'
    });
  }

  public reset(): void {
    this.pause();
    this.state = this.createInitialState();
    
    this.emitEvent({
      id: uuidv4(),
      timestamp: Date.now(),
      deviceId: 'system',
      deviceName: 'System',
      type: 'info',
      severity: 'info',
      message: 'Simulation reset to initial state'
    });
  }

  public setAttackState(attack: Partial<AttackState>): void {
    this.state.attack = { ...this.state.attack, ...attack };
    
    if (attack.firmwareTamper !== undefined) {
      this.state.devices.forEach(device => {
        device.integrityRisk = attack.firmwareTamper!;
      });
      
      this.emitEvent({
        id: uuidv4(),
        timestamp: Date.now(),
        deviceId: 'system',
        deviceName: 'System',
        type: attack.firmwareTamper ? 'tampering' : 'info',
        severity: attack.firmwareTamper ? 'critical' : 'info',
        message: attack.firmwareTamper 
          ? 'Firmware tampering detected across all devices!' 
          : 'Firmware integrity restored'
      });
    }
  }

  public setDefenseState(defense: Partial<DefenseState>): void {
    this.state.defense = { ...this.state.defense, ...defense };
    
    if (defense.signatureCheck !== undefined) {
      this.emitEvent({
        id: uuidv4(),
        timestamp: Date.now(),
        deviceId: 'system',
        deviceName: 'System',
        type: 'info',
        severity: 'info',
        message: defense.signatureCheck 
          ? 'Signature verification enabled' 
          : 'Signature verification disabled'
      });
    }
  }

  public getState(): SimulationState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public addEventListener(callback: (event: SimulationEvent) => void): void {
    this.eventListeners.push(callback);
  }

  private emitEvent(event: SimulationEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  private calculateDeviceMetrics(
    base: Omit<DeviceMetrics, 'timestamp'>,
    attackFactor: number,
    isTampered: boolean
  ): DeviceMetrics {
    const variance = (value: number): number => 
      value * (1 + (Math.random() * 2 - 1) * METRIC_VARIANCE);
    
    // Increase metrics if device is under attack or compromised
    const attackMultiplier = 1 + (attackFactor - 1) * 0.5;
    
    // Further increase if firmware is tampered
    const tamperMultiplier = isTampered ? 1.3 : 1;
    
    return {
      cpu: variance(Math.min(100, base.cpu * attackMultiplier * tamperMultiplier)),
      mem: variance(Math.min(100, base.mem * attackMultiplier * tamperMultiplier)),
      netIn: variance(base.netIn * attackMultiplier * tamperMultiplier),
      netOut: variance(base.netOut * attackMultiplier * tamperMultiplier),
      msgRate: base.msgRate ? variance(base.msgRate * attackMultiplier * tamperMultiplier) : 0,
      failedAuth: base.failedAuth || 0,
      timestamp: Date.now()
    };
  }

  private updateDeviceMetrics(): void {
    const now = Date.now();
    
    this.state.devices.forEach(device => {
      const baseMetric = BASE_METRICS[device.type];
      const attackFactor = device.compromised ? 1.5 : 1;
      
      // Update metrics with some randomness and attack influence
      device.metrics = this.calculateDeviceMetrics(baseMetric, attackFactor, device.integrityRisk);
      
      // Gradually reduce failed auth attempts
      if ((device.metrics.failedAuth || 0) > 0 && Math.random() > 0.7) {
        device.metrics.failedAuth = (device.metrics.failedAuth || 0) - 1;
      }
      
      device.lastUpdated = now;
    });
    
    this.state.lastUpdated = now;
    this.notifyStateChange();
  }

  private updateRiskScores(): void {
    this.state.devices.forEach(device => {
      const oldRisk = device.riskScore;
      device.riskScore = this.calculateDeviceRisk(device);
      
      // Notify if risk level changed significantly
      if (Math.abs(device.riskScore - oldRisk) > 15) {
        const riskChange = device.riskScore > oldRisk ? 'increased' : 'decreased';
        this.emitEvent({
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'risk_change',
          severity: 'info',
          message: `Risk level ${riskChange} for ${device.name} (${device.id}): ${Math.round(device.riskScore)}/100`,
          deviceId: device.id
        });
      }
    });
    
    this.notifyStateChange();
  }

  private calculateDeviceRisk(device: Device): number {
    let riskScore = 0;
    const metrics = device.metrics;
    
    // Base risk from device type
    const baseRisks: Record<DeviceType, number> = {
      cctv: 40,
      ip_camera: 45,
      door_lock: 60,
      smart_bulb: 25,
      thermostat: 30
    };
    
    riskScore = baseRisks[device.type];
    
    // Increase risk for weak passwords
    if (device.weakPassword) riskScore += 20;
    
    // Increase risk for high CPU usage
    if (metrics.cpu > 80) riskScore += 15;
    else if (metrics.cpu > 50) riskScore += 7;
    
    // Increase risk for high network activity
    if (metrics.netIn > 500 || metrics.netOut > 500) riskScore += 15;
    else if (metrics.netIn > 200 || metrics.netOut > 200) riskScore += 7;
    
    // Increase risk for failed auth attempts
    if ((metrics.failedAuth || 0) > 5) riskScore += 20;
    else if ((metrics.failedAuth || 0) > 0) riskScore += 5;
    
    // Increase risk if compromised or tampered
    if (device.compromised) riskScore += 30;
    if (device.integrityRisk) riskScore += 25;
    
    // Cap risk score at 100
    return Math.min(100, Math.max(0, riskScore));
  }

  private notifyStateChange(): void {
    // This will be used to notify listeners of state changes
    // Implementation will be added when we set up WebSocket integration
  }

  private applyAttackEffects(device: Device): void {
    const { attack } = this.state;
    const now = Date.now();
    
    // SYN Flood attack
    if (attack.synFlood > 0) {
      const attackStrength = attack.synFlood / 100;
      device.metrics.netIn += 500 * attackStrength * (1 + Math.random());
      device.metrics.cpu += 10 * attackStrength * (1 + Math.random());
      
      if (Math.random() < 0.1 * attackStrength) {
        this.emitEvent({
          id: uuidv4(),
          timestamp: now,
          type: 'attack',
          severity: attack.synFlood > 70 ? 'high' : attack.synFlood > 30 ? 'medium' : 'low',
          message: `SYN flood attack detected on ${device.name} (${device.id})`,
          deviceId: device.id
        });
      }
    }
    
    // Dictionary attack
    if (attack.dictionaryAttack > 0 && !device.compromised) {
      const attackStrength = attack.dictionaryAttack / 100;
      device.metrics.failedAuth = (device.metrics.failedAuth || 0) + Math.floor(5 * attackStrength);
      
      // Check if device is compromised
      if (device.weakPassword && Math.random() < 0.05 * attackStrength) {
        device.compromised = true;
        this.emitEvent({
          id: uuidv4(),
          timestamp: now,
          type: 'compromise',
          severity: 'critical',
          message: `Device ${device.name} (${device.id}) has been compromised!`,
          deviceId: device.id
        });
      }
    }
    
    // MQTT Flood
    if (attack.mqttFlood > 0) {
      const attackStrength = attack.mqttFlood / 100;
      device.metrics.msgRate = (device.metrics.msgRate || 0) + 50 * attackStrength * (1 + Math.random());
      device.metrics.cpu += 5 * attackStrength * (1 + Math.random());
      
      if (Math.random() < 0.1 * attackStrength) {
        this.emitEvent({
          id: uuidv4(),
          timestamp: now,
          type: 'attack',
          severity: attack.mqttFlood > 70 ? 'high' : 'medium',
          message: `MQTT flood attack detected on ${device.name} (${device.id})`,
          deviceId: device.id
        });
      }
    }
    
    // Firmware tampering
    if (attack.firmwareTamper && !device.integrityRisk) {
      if (Math.random() < 0.05) { // 5% chance per tick when attack is active
        device.integrityRisk = true;
        this.emitEvent({
          id: uuidv4(),
          timestamp: now,
          type: 'tampering',
          severity: 'critical',
          message: `Firmware tampering detected on ${device.name} (${device.id})`,
          deviceId: device.id
        });
      }
    }
  }
  
  private applyDefenseMitigations(device: Device): void {
    const { defense } = this.state;
    
    // Rate limiting
    if (defense.rateLimiting) {
      device.metrics.netIn = Math.min(device.metrics.netIn, 1000);
      if (device.metrics.msgRate) {
        device.metrics.msgRate = Math.min(device.metrics.msgRate, 100);
      }
    }
    
    // Account lockout
    if (defense.accountLockout && device.metrics.failedAuth > 5) {
      // Simulate account lockout by preventing further auth attempts
      device.metrics.failedAuth = 5;
    }
    
    // Signature check (prevents firmware tampering)
    if (defense.signatureCheck && device.integrityRisk) {
      device.integrityRisk = false;
      this.emitEvent({
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'defense',
        severity: 'info',
        message: `Firmware integrity restored on ${device.name} (${device.id})`,
        deviceId: device.id
      });
    }
  }

  private tick(): void {
    const now = Date.now();
    
    // Update device states based on attack/defense
    this.state.devices.forEach(device => {
      // Apply attack effects
      this.applyAttackEffects(device);
      
      // Apply defense mitigations
      this.applyDefenseMitigations(device);
      
      // Update device timestamps
      device.lastUpdated = now;
    });
    
    // Update global state
    this.state.lastUpdated = now;
    this.notifyStateChange();
  }

  // Apply attack effects to a device
  private applyAttackEffects(device: Device): void {
    const { attack } = this.state;
    const now = Date.now();
    
    // SYN Flood attack
    if (attack.synFlood > 0) {
      const attackStrength = attack.synFlood / 100;
      device.metrics.netIn += 500 * attackStrength * (1 + Math.random());
      device.metrics.cpu += 10 * attackStrength * (1 + Math.random());
      
      if (Math.random() < 0.1 * attackStrength) {
      if (Math.random() < 0.1 * intensity) {
        this.emitEvent({
          id: uuidv4(),
          timestamp: Date.now(),
          deviceId: device.id,
          deviceName: device.name,
          type: 'warning',
          message: 'Unusual network activity detected',
          details: { type: 'syn_flood', intensity: attack.synFlood }
        });
      }
    }
    
    // Apply Dictionary Attack
    if (attack.dictionaryAttack > 0 && !(defense.accountLockout && device.metrics.failedAuth! > 5)) {
      device.metrics.failedAuth = (device.metrics.failedAuth || 0) + attack.dictionaryAttack / 20;
      
      if (device.weakPassword && !device.compromised && device.metrics.failedAuth > 10) {
        device.compromised = true;
        this.emitEvent({
          id: uuidv4(),
          timestamp: Date.now(),
          deviceId: device.id,
          deviceName: device.name,
          type: 'alert',
          message: 'Device compromised via dictionary attack!',
          details: { failedAttempts: Math.floor(device.metrics.failedAuth) }
        });
      }
    }
    
    // Apply MQTT Flood
    if (attack.mqttFlood > 0) {
      const intensity = attack.mqttFlood / 100;
      device.metrics.msgRate = (device.metrics.msgRate || 0) + 10 * intensity;
      device.metrics.mem += (0.1 + Math.random() * 0.3) * intensity;
      
      if (Math.random() < 0.1 * intensity) {
        this.emitEvent({
          id: uuidv4(),
          timestamp: Date.now(),
          deviceId: device.id,
          deviceName: device.name,
          type: 'warning',
          message: 'High message rate detected',
          details: { rate: Math.floor(device.metrics.msgRate!), type: 'mqtt_flood' }
        });
      }
    }
    
    // Apply Firmware Tamper
    if (attack.firmwareTamper && !device.integrityRisk) {
      device.integrityRisk = true;
      this.emitEvent({
        id: uuidv4(),
        timestamp: Date.now(),
        deviceId: device.id,
        deviceName: device.name,
        type: 'alert',
        message: 'Firmware integrity check failed!',
        details: { firmwareVersion: device.firmwareVersion }
      });
    }
    
    // Apply rate limiting if enabled
    if (defense.rateLimiting) {
      device.metrics.netIn *= 0.7; // Reduce incoming traffic by 30%
      device.metrics.msgRate = (device.metrics.msgRate || 0) * 0.5; // Reduce message rate by 50%
    }
    
    // Apply signature check if enabled
    if (defense.signatureCheck && device.integrityRisk) {
      if (Math.random() < 0.05) { // 5% chance per tick to recover
        device.integrityRisk = false;
        this.emitEvent({
          id: uuidv4(),
          timestamp: Date.now(),
          deviceId: device.id,
          deviceName: device.name,
          type: 'info',
          message: 'Firmware integrity restored',
          details: { action: 'signature_verification' }
        });
      }
    }
    
    // Normalize values
    device.metrics.cpu = Math.min(100, Math.max(0, device.metrics.cpu - 0.5 + Math.random() * 1));
    device.metrics.mem = Math.min(100, Math.max(10, device.metrics.mem - 0.2 + Math.random() * 0.4));
    device.metrics.netIn = Math.max(0, device.metrics.netIn * (0.9 + Math.random() * 0.2));
    device.metrics.netOut = Math.max(0.05, device.metrics.netOut * (0.9 + Math.random() * 0.2));
    
    if (device.metrics.battery !== undefined) {
      device.metrics.battery = Math.max(0, device.metrics.battery - 0.01);
    }
    
    // Reset failed auth attempts if account lockout is enabled and threshold is reached
    if (defense.accountLockout && device.metrics.failedAuth! > 5) {
      if (Math.random() < 0.02) { // 2% chance per tick to reset after lockout
        device.metrics.failedAuth = 0;
      }
    }
  }
}
