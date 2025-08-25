import { describe, it, expect } from 'vitest';
import { Device } from '../../../server/src/types';

// Mock device data for testing
const createTestDevice = (overrides: Partial<Device> = {}): Device => ({
  id: 'test-device',
  name: 'Test Device',
  type: 'camera',
  firmwareVersion: '1.0.0',
  ip: '192.168.1.100',
  mac: '00:11:22:33:44:55',
  lastSeen: Date.now(),
  status: 'online',
  compromised: false,
  integrityRisk: false,
  weakPassword: false,
  metrics: {
    cpu: 30,
    mem: 40,
    netIn: 10,
    netOut: 5,
    battery: 80,
    msgRate: 5,
    failedAuth: 0,
    timestamp: Date.now()
  },
  ...overrides
});

describe('Risk Score Calculation', () => {
  it('should calculate minimal risk for a secure device', () => {
    const device = createTestDevice();
    const score = calculateRiskScore(device);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(20);
  });

  it('should increase risk for a compromised device', () => {
    const secureDevice = createTestDevice({ compromised: false });
    const compromisedDevice = createTestDevice({ compromised: true });
    
    const secureScore = calculateRiskScore(secureDevice);
    const compromisedScore = calculateRiskScore(compromisedDevice);
    
    expect(compromisedScore).toBeGreaterThan(secureScore);
    expect(compromisedScore).toBeGreaterThanOrEqual(70);
  });

  it('should increase risk for high CPU usage', () => {
    const normalCpuDevice = createTestDevice({ metrics: { cpu: 30 } });
    const highCpuDevice = createTestDevice({ metrics: { cpu: 90 } });
    
    const normalScore = calculateRiskScore(normalCpuDevice);
    const highScore = calculateRiskScore(highCpuDevice);
    
    expect(highScore).toBeGreaterThan(normalScore);
  });

  it('should increase risk for weak password', () => {
    const strongPassDevice = createTestDevice({ weakPassword: false });
    const weakPassDevice = createTestDevice({ weakPassword: true });
    
    const strongScore = calculateRiskScore(strongPassDevice);
    const weakScore = calculateRiskScore(weakPassDevice);
    
    expect(weakScore).toBeGreaterThan(strongScore);
    expect(weakScore - strongScore).toBeGreaterThanOrEqual(30);
  });

  it('should cap risk score at 100', () => {
    const maxRiskDevice = createTestDevice({
      compromised: true,
      integrityRisk: true,
      weakPassword: true,
      metrics: {
        cpu: 100,
        mem: 100,
        netIn: 1000,
        netOut: 1000,
        failedAuth: 100
      }
    });
    
    const score = calculateRiskScore(maxRiskDevice);
    expect(score).toBe(100);
  });
});

// This is a simplified version of the risk score calculation used in the components
function calculateRiskScore(device: Device): number {
  let score = 0;
  
  // Base risk factors
  if (device.compromised) score += 70;
  if (device.integrityRisk) score += 50;
  if (device.weakPassword) score += 30;
  
  // Add metrics-based risk
  score += Math.min(device.metrics.cpu * 0.3, 20);
  score += Math.min(device.metrics.mem * 0.2, 15);
  score += Math.min(device.metrics.netIn * 0.1, 5);
  score += Math.min(device.metrics.netOut * 0.1, 5);
  
  if (device.metrics.failedAuth) {
    score += Math.min(device.metrics.failedAuth * 0.5, 10);
  }
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
}
