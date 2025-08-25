import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { 
  SimulationState, 
  SimulationEvent, 
  Device, 
  AttackState, 
  DefenseState 
} from '../../../server/src/types';

export * from './useSimulationStore';

// API client configuration
const API_BASE_URL = 'http://localhost:5050/api';

interface StoreState {
  // Simulation state
  state: SimulationState;
  events: SimulationEvent[];
  selectedDeviceId: string | null;
  connected: boolean;
  socket: Socket | null;
  
  // Actions
  setState: (state: SimulationState) => void;
  addEvent: (event: SimulationEvent) => void;
  clearEvents: () => void;
  setSelectedDevice: (deviceId: string | null) => void;
  setConnected: (connected: boolean) => void;
  getSelectedDevice: () => Device | undefined;
  
  // API methods
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  setAttack: (attack: Partial<AttackState>) => Promise<void>;
  setDefense: (defense: Partial<DefenseState>) => Promise<void>;
  fetchDevices: () => Promise<Device[]>;
  fetchDevice: (id: string) => Promise<Device | null>;
  
  // Socket methods
  connectSocket: () => void;
  disconnectSocket: () => void;
  setSocket: (socket: Socket | null) => void;
}

const initialState: Partial<StoreState> = {
  state: {
    running: false,
    startedAt: 0,
    lastUpdated: 0,
    tickInterval: 500,
    devices: [],
    attack: {
      synFlood: 0,
      dictionaryAttack: 0,
      mqttFlood: 0,
      firmwareTamper: false,
    },
    defense: {
      rateLimiting: false,
      accountLockout: false,
      signatureCheck: false,
    },
  },
  events: [],
  selectedDeviceId: null,
  connected: false,
};

const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setState: (state) => set({ state }),
        
        addEvent: (event) => 
          set((prev) => ({
            events: [event, ...prev.events].slice(0, 200), // Keep last 200 events
          })),
          
        clearEvents: () => set({ events: [] }),
        
        setSelectedDevice: (deviceId) => set({ selectedDeviceId: deviceId }),
        
        setConnected: (connected) => set({ connected }),
        
        getSelectedDevice: () => {
          const state = get().state;
          const deviceId = get().selectedDeviceId;
          return state.devices.find(d => d.id === deviceId);
        },
        
        // API Methods
        startSimulation: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/sim/start`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to start simulation');
          } catch (error) {
            console.error('Error starting simulation:', error);
            throw error;
          }
        },
        
        pauseSimulation: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/sim/pause`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to pause simulation');
          } catch (error) {
            console.error('Error pausing simulation:', error);
            throw error;
          }
        },
        
        resetSimulation: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/sim/reset`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to reset simulation');
          } catch (error) {
            console.error('Error resetting simulation:', error);
            throw error;
          }
        },
        
        setAttack: async (attack) => {
          try {
            const [attackType, value] = Object.entries(attack)[0];
            let endpoint = '';
            let body = {};
            
            switch (attackType) {
              case 'synFlood':
              case 'dictionaryAttack':
              case 'mqttFlood':
                endpoint = attackType === 'synFlood' ? 'syn-flood' : 
                          attackType === 'dictionaryAttack' ? 'dictionary' : 'mqtt-flood';
                body = { intensity: value };
                break;
              case 'firmwareTamper':
                endpoint = 'firmware-tamper';
                body = { enabled: value };
                break;
            }
            
            const response = await fetch(`${API_BASE_URL}/attack/${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            
            if (!response.ok) throw new Error(`Failed to set ${attackType}`);
          } catch (error) {
            console.error(`Error setting attack:`, error);
            throw error;
          }
        },
        
        setDefense: async (defense) => {
          try {
            const [defenseType, value] = Object.entries(defense)[0];
            const endpoint = defenseType.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
            
            const response = await fetch(`${API_BASE_URL}/defense/${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled: value })
            });
            
            if (!response.ok) throw new Error(`Failed to set ${defenseType}`);
          } catch (error) {
            console.error(`Error setting defense:`, error);
            throw error;
          }
        },
        
        fetchDevices: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/devices`);
            if (!response.ok) throw new Error('Failed to fetch devices');
            const data = await response.json();
            return data.devices || [];
          } catch (error) {
            console.error('Error fetching devices:', error);
            throw error;
          }
        },
        
        fetchDevice: async (id: string) => {
          try {
            const response = await fetch(`${API_BASE_URL}/devices/${id}`);
            if (!response.ok) throw new Error('Failed to fetch device');
            return await response.json();
          } catch (error) {
            console.error(`Error fetching device ${id}:`, error);
            return null;
          }
        },
        
        // Socket Methods
        setSocket: (socket) => set({ socket }),
        
        connectSocket: () => set((state) => {
          // Close existing socket if any
          if (state.socket) {
            state.socket.disconnect();
          }

          // Create new socket connection
          const socket = io('http://localhost:5050', {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
          });

          // Set up event listeners
          socket.on('connect', () => {
            set({ connected: true });
            console.log('Connected to WebSocket server');
          });

          socket.on('disconnect', () => {
            set({ connected: false });
            console.log('Disconnected from WebSocket server');
          });

          socket.on('state', (state: SimulationState) => {
            set({ state });
          });

          socket.on('event', (event: SimulationEvent) => {
            set((state) => ({
              events: [event, ...state.events].slice(0, 1000), // Keep last 1000 events
            }));
          });

          return { socket };
        }),
        },
        
        disconnectSocket: () => {
          const { socket } = get();
          if (socket) {
            socket.disconnect();
            set({ socket: null, connected: false });
          }
        },
      }),
      {
        name: 'iot-threat-simulator-storage',
        partialize: (state) => ({
          // Only persist UI preferences, not the simulation state
          events: state.events,
        }),
      }
    ),
    {
      name: 'IoT Threat Simulator',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

export default useStore;
