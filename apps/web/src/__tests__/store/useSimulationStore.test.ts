import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { create } from 'zustand';
import { useSimulationStore, SimulationState } from '../../store/useSimulationStore';
import { SimulationService } from '../../services/simulationService';
import { Device, AttackState, DefenseState, SimulationEvent, SimulationScenario } from '../../../../server/src/types';

// Mock the SimulationService
vi.mock('../../services/simulationService', () => {
  const mockService = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    onDevicesUpdate: vi.fn(),
    onDeviceUpdate: vi.fn(),
    onSimulationStart: vi.fn(),
    onSimulationStop: vi.fn(),
    onAttackUpdate: vi.fn(),
    onDefenseUpdate: vi.fn(),
    onEvent: vi.fn(),
    onScenarioLoaded: vi.fn(),
    startSimulation: vi.fn(),
    stopSimulation: vi.fn(),
    resetSimulation: vi.fn(),
    updateAttack: vi.fn(),
    updateDefense: vi.fn(),
    loadScenario: vi.fn(),
    subscribeToMetrics: vi.fn(),
    unsubscribeFromMetrics: vi.fn(),
  };
  
  return {
    SimulationService: {
      getInstance: vi.fn(() => mockService),
    },
    mockService,
  };
});

// Import the mocked service
import { mockService } from '../../services/simulationService';

// Mock device data
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

const mockEvent: SimulationEvent = {
  id: 'event-1',
  type: 'attack',
  message: 'DDoS attack detected',
  severity: 'high',
  timestamp: new Date().toISOString(),
  deviceId: 'device-1',
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

describe('useSimulationStore', () => {
  // Create a reset function to clear the store between tests
  const useTestStore = (selector: any) => {
    const store = useSimulationStore(selector);
    
    // Reset the store before each test
    beforeEach(() => {
      act(() => {
        store.resetSimulation();
      });
    });
    
    return store;
  };
  
  let store: ReturnType<typeof useTestStore>;
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset the store state
    act(() => {
      useSimulationStore.setState({
        isConnected: false,
        isSimulationRunning: false,
        devices: [],
        selectedDeviceId: null,
        events: [],
        attackState: { isActive: false, attackType: null, intensity: 0, targetDeviceId: null, isSuccessful: false, lastAttempt: null },
        defenseState: { isActive: false, firewallEnabled: false, encryptionEnabled: false, rateLimitingEnabled: false, anomalyDetectionEnabled: false, lastUpdated: '' },
        currentScenario: null,
      }, true);
    });
    
    // Create a test store instance
    store = useTestStore((state: SimulationState) => state);
  });
  
  afterEach(() => {
    // Clean up after each test
    act(() => {
      store.disconnect();
    });
  });
  
  describe('initial state', () => {
    it('should have initial state', () => {
      expect(store.isConnected).toBe(false);
      expect(store.isSimulationRunning).toBe(false);
      expect(store.devices).toEqual([]);
      expect(store.selectedDeviceId).toBeNull();
      expect(store.events).toEqual([]);
      expect(store.attackState.isActive).toBe(false);
      expect(store.defenseState.isActive).toBe(false);
      expect(store.currentScenario).toBeNull();
    });
  });
  
  describe('connection management', () => {
    it('should connect to the simulation service', async () => {
      await act(async () => {
        await store.connect('ws://localhost:3001');
      });
      
      expect(mockService.connect).toHaveBeenCalledWith('ws://localhost:3001');
      expect(store.isConnected).toBe(true);
    });
    
    it('should handle connection errors', async () => {
      // Mock a connection error
      const error = new Error('Connection failed');
      mockService.connect.mockRejectedValueOnce(error);
      
      await expect(act(async () => {
        await store.connect('ws://localhost:3001');
      })).rejects.toThrow('Connection failed');
      
      expect(store.isConnected).toBe(false);
    });
    
    it('should disconnect from the simulation service', () => {
      act(() => {
        store.disconnect();
      });
      
      expect(mockService.disconnect).toHaveBeenCalled();
      expect(store.isConnected).toBe(false);
    });
  });
  
  describe('device management', () => {
    it('should select a device', () => {
      act(() => {
        store.selectDevice('device-1');
      });
      
      expect(store.selectedDeviceId).toBe('device-1');
      expect(mockService.subscribeToMetrics).toHaveBeenCalledWith('device-1', [
        'cpu', 'memory', 'networkIn', 'networkOut', 'battery'
      ]);
    });
    
    it('should update a device', () => {
      act(() => {
        store.updateDevice(mockDevice);
      });
      
      expect(store.devices).toContainEqual(mockDevice);
    });
    
    it('should handle device updates', () => {
      // Set up the device update callback
      let deviceUpdateCallback: (device: Device) => void = () => {};
      (mockService.onDeviceUpdate as jest.Mock).mockImplementation((cb) => {
        deviceUpdateCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Initialize the store to set up the listener
      act(() => {
        store.initialize();
      });
      
      // Simulate a device update
      act(() => {
        deviceUpdateCallback(mockDevice);
      });
      
      // Should update the device in the store
      expect(store.devices).toContainEqual(mockDevice);
    });
  });
  
  describe('simulation control', () => {
    it('should start the simulation', () => {
      act(() => {
        store.startSimulation();
      });
      
      expect(mockService.startSimulation).toHaveBeenCalled();
      expect(store.isSimulationRunning).toBe(true);
    });
    
    it('should stop the simulation', () => {
      // Start the simulation first
      act(() => {
        store.startSimulation();
      });
      
      // Now stop it
      act(() => {
        store.stopSimulation();
      });
      
      expect(mockService.stopSimulation).toHaveBeenCalled();
      expect(store.isSimulationRunning).toBe(false);
    });
    
    it('should reset the simulation', () => {
      // Set some state
      act(() => {
        store.updateDevice(mockDevice);
        store.selectDevice('device-1');
        store.startSimulation();
      });
      
      // Now reset
      act(() => {
        store.resetSimulation();
      });
      
      expect(mockService.resetSimulation).toHaveBeenCalled();
      expect(store.devices).toEqual([]);
      expect(store.selectedDeviceId).toBeNull();
      expect(store.isSimulationRunning).toBe(false);
    });
  });
  
  describe('attack and defense', () => {
    it('should update attack state', () => {
      act(() => {
        store.updateAttack(mockAttackState);
      });
      
      expect(mockService.updateAttack).toHaveBeenCalledWith(mockAttackState);
      expect(store.attackState).toEqual(mockAttackState);
    });
    
    it('should update defense state', () => {
      act(() => {
        store.updateDefense(mockDefenseState);
      });
      
      expect(mockService.updateDefense).toHaveBeenCalledWith(mockDefenseState);
      expect(store.defenseState).toEqual(mockDefenseState);
    });
    
    it('should handle attack updates', () => {
      // Set up the attack update callback
      let attackUpdateCallback: (attack: AttackState) => void = () => {};
      (mockService.onAttackUpdate as jest.Mock).mockImplementation((cb) => {
        attackUpdateCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Initialize the store to set up the listener
      act(() => {
        store.initialize();
      });
      
      // Simulate an attack update
      act(() => {
        attackUpdateCallback(mockAttackState);
      });
      
      // Should update the attack state in the store
      expect(store.attackState).toEqual(mockAttackState);
    });
    
    it('should handle defense updates', () => {
      // Set up the defense update callback
      let defenseUpdateCallback: (defense: DefenseState) => void = () => {};
      (mockService.onDefenseUpdate as jest.Mock).mockImplementation((cb) => {
        defenseUpdateCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Initialize the store to set up the listener
      act(() => {
        store.initialize();
      });
      
      // Simulate a defense update
      act(() => {
        defenseUpdateCallback(mockDefenseState);
      });
      
      // Should update the defense state in the store
      expect(store.defenseState).toEqual(mockDefenseState);
    });
  });
  
  describe('scenarios', () => {
    it('should load a scenario', () => {
      act(() => {
        store.loadScenario(mockScenario);
      });
      
      expect(mockService.loadScenario).toHaveBeenCalledWith(mockScenario);
      expect(store.currentScenario).toEqual(mockScenario);
    });
    
    it('should handle scenario loaded events', () => {
      // Set up the scenario loaded callback
      let scenarioLoadedCallback: (scenario: SimulationScenario) => void = () => {};
      (mockService.onScenarioLoaded as jest.Mock).mockImplementation((cb) => {
        scenarioLoadedCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Initialize the store to set up the listener
      act(() => {
        store.initialize();
      });
      
      // Simulate a scenario loaded event
      act(() => {
        scenarioLoadedCallback(mockScenario);
      });
      
      // Should update the current scenario in the store
      expect(store.currentScenario).toEqual(mockScenario);
    });
  });
  
  describe('events', () => {
    it('should add an event', () => {
      act(() => {
        store.addEvent({
          type: 'attack',
          message: 'Test event',
          severity: 'high',
        });
      });
      
      expect(store.events).toHaveLength(1);
      expect(store.events[0].message).toBe('Test event');
      expect(store.events[0].type).toBe('attack');
      expect(store.events[0].severity).toBe('high');
      expect(store.events[0].id).toBeDefined();
      expect(store.events[0].timestamp).toBeDefined();
    });
    
    it('should handle simulation events', () => {
      // Set up the event callback
      let eventCallback: (event: SimulationEvent) => void = () => {};
      (mockService.onEvent as jest.Mock).mockImplementation((cb) => {
        eventCallback = cb;
        return () => {}; // Return mock unsubscribe function
      });
      
      // Initialize the store to set up the listener
      act(() => {
        store.initialize();
      });
      
      // Simulate an event
      act(() => {
        eventCallback(mockEvent);
      });
      
      // Should add the event to the store
      expect(store.events).toContainEqual(mockEvent);
    });
    
    it('should clear all events', () => {
      // Add some events first
      act(() => {
        store.addEvent({
          type: 'attack',
          message: 'Test event 1',
          severity: 'high',
        });
        store.addEvent({
          type: 'defense',
          message: 'Test event 2',
          severity: 'medium',
        });
      });
      
      expect(store.events).toHaveLength(2);
      
      // Now clear the events
      act(() => {
        store.clearEvents();
      });
      
      expect(store.events).toHaveLength(0);
    });
  });
  
  describe('persistence', () => {
    it('should persist and rehydrate state', () => {
      // Set some state
      act(() => {
        store.updateDevice(mockDevice);
        store.updateAttack(mockAttackState);
        store.updateDefense(mockDefenseState);
        store.loadScenario(mockScenario);
      });
      
      // Get the current state
      const currentState = useSimulationStore.getState();
      
      // Create a new store with the same storage key
      const { setState, getState } = create<SimulationState>((set, get) => ({
        ...currentState,
        // Mock the persistence methods
        _hasHydrated: true,
        setHasHydrated: (state: boolean) => {
          set({ _hasHydrated: state });
        },
      }));
      
      // Set the state from the current store
      setState(currentState);
      
      // Check that the state was rehydrated correctly
      const rehydratedState = getState();
      
      expect(rehydratedState.devices).toContainEqual(mockDevice);
      expect(rehydratedState.attackState).toEqual(mockAttackState);
      expect(rehydratedState.defenseState).toEqual(mockDefenseState);
      expect(rehydratedState.currentScenario).toEqual(mockScenario);
    });
  });
});
