import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimulationService } from '../../services/simulationService';
import { SocketService } from '../../services/socketService';
import { Device, AttackState, DefenseState, SimulationEvent, SimulationScenario } from '../../../../server/src/types';

// Mock the SocketService
vi.mock('../../services/socketService', () => {
  const mockSocketService = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    onDevicesUpdate: vi.fn(),
    onDeviceUpdate: vi.fn(),
    onSimulationStart: vi.fn(),
    onSimulationStop: vi.fn(),
    onAttackUpdate: vi.fn(),
    onDefenseUpdate: vi.fn(),
    onEvent: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  };
  
  return {
    SocketService: {
      getInstance: vi.fn(() => mockSocketService),
    },
    mockSocketService,
  };
});

// Import the mocked SocketService
import { mockSocketService } from '../../services/socketService';

describe('SimulationService', () => {
  let simulationService: SimulationService;
  
  const mockDevice: Device = {
    id: 'device-1',
    name: 'Test Device',
    type: 'camera',
    status: 'online',
    compromised: false,
    integrityRisk: false,
    weakPassword: false,
    firmwareVersion: '1.0.0',
    ip: '192.168.1.100',
    mac: '00:11:22:33:44:55',
    lastSeen: new Date().toISOString(),
    metrics: {
      cpu: 0,
      mem: 0,
      netIn: 0,
      netOut: 0,
      battery: 100,
      msgRate: 0,
      failedAuth: 0,
      timestamp: Date.now(),
    },
  };
  
  const mockAttackState: AttackState = {
    isActive: true,
    attackType: 'ddos',
    intensity: 5,
    targetDeviceId: 'device-1',
    isSuccessful: false,
    lastAttempt: null,
  };
  
  const mockDefenseState: DefenseState = {
    isActive: true,
    firewallEnabled: true,
    encryptionEnabled: true,
    rateLimitingEnabled: true,
    anomalyDetectionEnabled: true,
    lastUpdated: new Date().toISOString(),
  };
  
  const mockScenario: SimulationScenario = {
    id: 'scenario-1',
    name: 'Test Scenario',
    description: 'A test scenario',
    attack: mockAttackState,
    defense: mockDefenseState,
    devices: [mockDevice],
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 300, // 5 minutes
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Create a new instance for each test
    simulationService = new SimulationService();
  });
  
  afterEach(() => {
    // Clean up after each test
    simulationService.disconnect();
  });

  describe('connect', () => {
    it('should connect to the WebSocket server', async () => {
      await simulationService.connect('ws://localhost:3001');
      
      expect(mockSocketService.connect).toHaveBeenCalledWith('ws://localhost:3001');
    });
    
    it('should set up event listeners after connection', async () => {
      await simulationService.connect('ws://localhost:3001');
      
      // Verify event listeners are set up
      expect(mockSocketService.onDevicesUpdate).toHaveBeenCalled();
      expect(mockSocketService.onDeviceUpdate).toHaveBeenCalled();
      expect(mockSocketService.onSimulationStart).toHaveBeenCalled();
      expect(mockSocketService.onSimulationStop).toHaveBeenCalled();
      expect(mockSocketService.onAttackUpdate).toHaveBeenCalled();
      expect(mockSocketService.onDefenseUpdate).toHaveBeenCalled();
      expect(mockSocketService.onEvent).toHaveBeenCalled();
    });
  });
  
  describe('device management', () => {
    it('should get devices', async () => {
      // Mock the devices callback
      let devicesCallback: (devices: Device[]) => void = () => {};
      (mockSocketService.onDevicesUpdate as jest.Mock).mockImplementation((callback) => {
        devicesCallback = callback;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Call getDevices (which should set up the subscription)
      const devicesPromise = simulationService.getDevices();
      
      // Simulate devices update
      const testDevices = [mockDevice];
      devicesCallback(testDevices);
      
      // Should resolve with the devices
      await expect(devicesPromise).resolves.toEqual(testDevices);
      
      // Should have requested devices from the server
      expect(mockSocketService.emit).toHaveBeenCalledWith('devices:get');
    });
    
    it('should handle device updates', () => {
      const callback = vi.fn();
      let deviceUpdateCallback: (device: Device) => void = () => {};
      
      // Mock the device update callback
      (mockSocketService.onDeviceUpdate as jest.Mock).mockImplementation((cb) => {
        deviceUpdateCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Subscribe to device updates
      const unsubscribe = simulationService.onDeviceUpdate(callback);
      
      // Simulate a device update
      deviceUpdateCallback(mockDevice);
      
      // Should call the callback with the updated device
      expect(callback).toHaveBeenCalledWith(mockDevice);
      
      // Test unsubscribe
      unsubscribe();
      callback.mockClear();
      
      // Simulate another update
      deviceUpdateCallback(mockDevice);
      
      // Should not call the unsubscribed callback
      expect(callback).not.toHaveBeenCalled();
    });
  });
  
  describe('simulation control', () => {
    it('should start the simulation', () => {
      simulationService.startSimulation();
      expect(mockSocketService.emit).toHaveBeenCalledWith('simulation:start');
    });
    
    it('should stop the simulation', () => {
      simulationService.stopSimulation();
      expect(mockSocketService.emit).toHaveBeenCalledWith('simulation:stop');
    });
    
    it('should reset the simulation', () => {
      simulationService.resetSimulation();
      expect(mockSocketService.emit).toHaveBeenCalledWith('simulation:reset');
    });
    
    it('should handle simulation start/stop events', () => {
      let startCallback: () => void = () => {};
      let stopCallback: () => void = () => {};
      
      // Mock the callbacks
      (mockSocketService.onSimulationStart as jest.Mock).mockImplementation((cb) => {
        startCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      (mockSocketService.onSimulationStop as jest.Mock).mockImplementation((cb) => {
        stopCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Set up listeners
      const onStart = vi.fn();
      const onStop = vi.fn();
      
      simulationService.onSimulationStart(onStart);
      simulationService.onSimulationStop(onStop);
      
      // Simulate start/stop events
      startCallback();
      stopCallback();
      
      // Should call the appropriate callbacks
      expect(onStart).toHaveBeenCalled();
      expect(onStop).toHaveBeenCalled();
    });
  });
  
  describe('attack and defense', () => {
    it('should update attack state', () => {
      simulationService.updateAttack(mockAttackState);
      expect(mockSocketService.emit).toHaveBeenCalledWith('attack:update', mockAttackState);
    });
    
    it('should update defense state', () => {
      simulationService.updateDefense(mockDefenseState);
      expect(mockSocketService.emit).toHaveBeenCalledWith('defense:update', mockDefenseState);
    });
    
    it('should handle attack/defense updates', () => {
      let attackCallback: (attack: AttackState) => void = () => {};
      let defenseCallback: (defense: DefenseState) => void = () => {};
      
      // Mock the callbacks
      (mockSocketService.onAttackUpdate as jest.Mock).mockImplementation((cb) => {
        attackCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      (mockSocketService.onDefenseUpdate as jest.Mock).mockImplementation((cb) => {
        defenseCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Set up listeners
      const onAttack = vi.fn();
      const onDefense = vi.fn();
      
      simulationService.onAttackUpdate(onAttack);
      simulationService.onDefenseUpdate(onDefense);
      
      // Simulate updates
      attackCallback(mockAttackState);
      defenseCallback(mockDefenseState);
      
      // Should call the appropriate callbacks
      expect(onAttack).toHaveBeenCalledWith(mockAttackState);
      expect(onDefense).toHaveBeenCalledWith(mockDefenseState);
    });
  });
  
  describe('scenarios', () => {
    it('should load a scenario', () => {
      simulationService.loadScenario(mockScenario);
      expect(mockSocketService.emit).toHaveBeenCalledWith('scenario:load', mockScenario);
    });
    
    it('should handle scenario loaded events', () => {
      let scenarioCallback: (scenario: SimulationScenario) => void = () => {};
      
      // Mock the callback
      (mockSocketService.on as jest.Mock).mockImplementation((event, cb) => {
        if (event === 'scenario:loaded') {
          scenarioCallback = cb;
        }
        return () => {}; // Return mock unsubscribe function
      });
      
      // Set up listener
      const onScenarioLoaded = vi.fn();
      simulationService.onScenarioLoaded(onScenarioLoaded);
      
      // Simulate scenario loaded
      scenarioCallback(mockScenario);
      
      // Should call the callback with the scenario
      expect(onScenarioLoaded).toHaveBeenCalledWith(mockScenario);
    });
  });
  
  describe('metrics', () => {
    it('should subscribe to metrics', () => {
      simulationService.subscribeToMetrics('device-1', ['cpu', 'memory']);
      expect(mockSocketService.emit).toHaveBeenCalledWith('metrics:subscribe', {
        deviceId: 'device-1',
        metrics: ['cpu', 'memory'],
      });
    });
    
    it('should unsubscribe from metrics', () => {
      simulationService.unsubscribeFromMetrics('device-1');
      expect(mockSocketService.emit).toHaveBeenCalledWith('metrics:unsubscribe', {
        deviceId: 'device-1',
      });
    });
    
    it('should handle metrics updates', () => {
      const metricsData = { cpu: 50, memory: 75 };
      let metricsCallback: (metrics: any) => void = () => {};
      
      // Mock the callback
      (mockSocketService.on as jest.Mock).mockImplementation((event, cb) => {
        if (event === 'metrics:update:device-1') {
          metricsCallback = cb;
        }
        return () => {}; // Return mock unsubscribe function
      });
      
      // Set up listener
      const onMetricsUpdate = vi.fn();
      const unsubscribe = simulationService.onMetricsUpdate('device-1', onMetricsUpdate);
      
      // Simulate metrics update
      metricsCallback(metricsData);
      
      // Should call the callback with the metrics data
      expect(onMetricsUpdate).toHaveBeenCalledWith(metricsData);
      
      // Test unsubscribe
      unsubscribe();
      onMetricsUpdate.mockClear();
      
      // Simulate another update
      metricsCallback(metricsData);
      
      // Should not call the unsubscribed callback
      expect(onMetricsUpdate).not.toHaveBeenCalled();
    });
  });
  
  describe('events', () => {
    it('should handle simulation events', () => {
      const testEvent: SimulationEvent = {
        id: 'event-1',
        type: 'attack',
        message: 'DDoS attack detected',
        severity: 'high',
        timestamp: new Date().toISOString(),
        deviceId: 'device-1',
      };
      
      let eventCallback: (event: SimulationEvent) => void = () => {};
      
      // Mock the callback
      (mockSocketService.onEvent as jest.Mock).mockImplementation((cb) => {
        eventCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Set up listener
      const onEvent = vi.fn();
      const unsubscribe = simulationService.onEvent(onEvent);
      
      // Simulate event
      eventCallback(testEvent);
      
      // Should call the callback with the event
      expect(onEvent).toHaveBeenCalledWith(testEvent);
      
      // Test unsubscribe
      unsubscribe();
      onEvent.mockClear();
      
      // Simulate another event
      eventCallback(testEvent);
      
      // Should not call the unsubscribed callback
      expect(onEvent).not.toHaveBeenCalled();
    });
  });
});
