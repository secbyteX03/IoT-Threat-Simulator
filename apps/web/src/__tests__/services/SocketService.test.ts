import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { io } from 'socket.io-client';
import { SocketService } from '../../services/socketService';
import { Device, AttackState, DefenseState, SimulationEvent } from '../../../../server/src/types';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    id: 'test-socket-id',
  };
  
  return {
    io: vi.fn(() => mockSocket),
    __esModule: true,
  };
});

describe('SocketService', () => {
  let socketService: SocketService;
  let mockSocket: any;
  
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

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a new instance for each test
    socketService = new SocketService();
    
    // Get the mock socket instance
    mockSocket = (io as jest.Mock).mock.results[0].value;
    mockSocket.connected = true;
  });
  
  afterEach(() => {
    // Clean up after each test
    socketService.disconnect();
  });

  describe('connect', () => {
    it('should connect to the WebSocket server', async () => {
      const connectPromise = socketService.connect('ws://localhost:3001');
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
      }
      
      await expect(connectPromise).resolves.toBeUndefined();
      expect(io).toHaveBeenCalledWith('ws://localhost:3001', expect.any(Object));
      expect(mockSocket.connect).toHaveBeenCalled();
    });
    
    it('should handle connection errors', async () => {
      const connectPromise = socketService.connect('ws://localhost:3001');
      
      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect_error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler(new Error('Connection failed'));
      }
      
      await expect(connectPromise).rejects.toThrow('Failed to connect to WebSocket server');
    });
  });
  
  describe('event handling', () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = socketService.connect('ws://localhost:3001');
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
      }
      
      await connectPromise;
    });
    
    it('should handle device updates', () => {
      const callback = vi.fn();
      socketService.onDeviceUpdate(callback);
      
      // Simulate a device update event
      const anyEventHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'device:update'
      )?.[1];
      
      if (anyEventHandler) {
        anyEventHandler(mockDevice);
      }
      
      expect(callback).toHaveBeenCalledWith(mockDevice);
    });
    
    it('should handle attack updates', () => {
      const callback = vi.fn();
      socketService.onAttackUpdate(callback);
      
      // Simulate an attack update event
      const anyEventHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'attack:update'
      )?.[1];
      
      if (anyEventHandler) {
        anyEventHandler(mockAttackState);
      }
      
      expect(callback).toHaveBeenCalledWith(mockAttackState);
    });
    
    it('should handle defense updates', () => {
      const callback = vi.fn();
      socketService.onDefenseUpdate(callback);
      
      // Simulate a defense update event
      const anyEventHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'defense:update'
      )?.[1];
      
      if (anyEventHandler) {
        anyEventHandler(mockDefenseState);
      }
      
      expect(callback).toHaveBeenCalledWith(mockDefenseState);
    });
    
    it('should handle custom events', () => {
      const eventName = 'custom:event';
      const eventData = { foo: 'bar' };
      const callback = vi.fn();
      
      // Subscribe to custom event
      const unsubscribe = socketService.on(eventName, callback);
      
      // Simulate a custom event
      const anyEventHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'custom:event'
      )?.[1];
      
      if (anyEventHandler) {
        anyEventHandler(eventData);
      }
      
      expect(callback).toHaveBeenCalledWith(eventData);
      
      // Test unsubscribe
      unsubscribe();
      callback.mockClear();
      
      if (anyEventHandler) {
        anyEventHandler(eventData);
      }
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from the WebSocket server', () => {
      socketService.connect('ws://localhost:3001');
      socketService.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
  
  describe('emitting events', () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = socketService.connect('ws://localhost:3001');
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
      }
      
      await connectPromise;
    });
    
    it('should emit events to the server', () => {
      const eventData = { foo: 'bar' };
      socketService.emit('test:event', eventData);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test:event', eventData);
    });
    
    it('should queue events when not connected', async () => {
      // Disconnect first
      socketService.disconnect();
      
      // Emit an event while disconnected
      socketService.emit('test:event', { foo: 'bar' });
      
      // Should not emit immediately
      expect(mockSocket.emit).not.toHaveBeenCalled();
      
      // Reconnect
      const connectPromise = socketService.connect('ws://localhost:3001');
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
      }
      
      await connectPromise;
      
      // Should emit queued events after reconnection
      expect(mockSocket.emit).toHaveBeenCalledWith('test:event', { foo: 'bar' });
    });
  });
});
