import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Socket } from 'socket.io-client';
import { 
  Device, 
  AttackState, 
  DefenseState, 
  SimulationEvent, 
  SimulationScenario,
  SimulationState as ServerSimulationState
} from '@/types/simulation';

// Local types
type SimulationState = {
  // Connection state
  isConnected: boolean;
  isSimulationRunning: boolean;
  socket: Socket | null;
  
  // Data state
  devices: Device[];
  selectedDeviceId: string | null;
  events: SimulationEvent[];
  attackState: AttackState;
  defenseState: DefenseState;
  currentScenario: SimulationScenario | null;
  
  // Server state
  serverState: ServerSimulationState | null;
};

// Actions
type SimulationActions = {
  // Connection actions
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  setSocket: (socket: Socket | null) => void;
  
  // Device actions
  selectDevice: (deviceId: string | null) => void;
  updateDevice: (device: Device) => void;
  
  // Simulation control
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  loadScenario: (scenario: SimulationScenario) => void;
  
  // Attack/Defense actions
  updateAttack: (attack: Partial<AttackState>) => void;
  updateDefense: (defense: Partial<DefenseState>) => void;
  
  // Event handling
  addEvent: (event: Omit<SimulationEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  
  // Server state
  updateServerState: (state: ServerSimulationState) => void;
  
  // Initialization
  initialize: () => void;
  cleanup: () => void;
};

export type UseSimulationStore = SimulationState & SimulationActions;

const defaultAttackState: AttackState = {
  synFlood: 0,
  dictionaryAttack: 0,
  mqttFlood: 0,
  firmwareTamper: false,
  isActive: false,
  attackType: null,
  intensity: 0,
  targetDeviceId: null,
  isSuccessful: false,
  lastAttempt: null,
};

const defaultDefenseState: DefenseState = {
  isActive: false,
  firewallEnabled: true,
  encryptionEnabled: true,
  rateLimitingEnabled: true,
  anomalyDetectionEnabled: true,
  lastUpdated: Date.now(),
  defenseLevel: 'medium',
  autoMitigation: true,
  blockMaliciousIPs: true,
  logMonitoring: true,
};

// Create the store with persistence for certain state
const useSimulationStore = create<UseSimulationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isSimulationRunning: false,
      socket: null,
      devices: [],
      selectedDeviceId: null,
      events: [],
      attackState: defaultAttackState,
      defenseState: defaultDefenseState,
      currentScenario: null,
      serverState: null,

      // Connection actions
      setSocket: (socket) => set({ socket }),
      
      connect: async (url = 'http://localhost:5050') => {
        try {
          const { io } = await import('socket.io-client');
          const socket = io(url);
          
          socket.on('connect', () => {
            set({ isConnected: true });
            console.log('Connected to WebSocket server');
          });
          
          socket.on('disconnect', () => {
            set({ isConnected: false });
            console.log('Disconnected from WebSocket server');
          });
          
          socket.on('state', (state: ServerSimulationState) => {
            set({ serverState: state });
          });
          
          socket.on('event', (event: SimulationEvent) => {
            set((state) => ({
              events: [event, ...state.events].slice(0, 1000), // Keep last 1000 events
            }));
          });
          
          set({ socket });
        } catch (error) {
          console.error('Failed to connect to WebSocket server:', error);
        }
      },
      
      disconnect: () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null, isConnected: false });
        }
      },
      
      // Device actions
      selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),
      
      updateDevice: (device) => 
        set((state) => ({
          devices: state.devices.map((d) => (d.id === device.id ? device : d)),
        })),
      
      // Simulation control
      startSimulation: () => {
        const { socket } = get();
        if (socket) {
          socket.emit('start');
          set({ isSimulationRunning: true });
        }
      },
      
      stopSimulation: () => {
        const { socket } = get();
        if (socket) {
          socket.emit('stop');
          set({ isSimulationRunning: false });
        }
      },
      
      resetSimulation: () => {
        const { socket } = get();
        if (socket) {
          socket.emit('reset');
          set({
            isSimulationRunning: false,
            events: [],
            attackState: defaultAttackState,
            defenseState: defaultDefenseState,
          });
        }
      },
      
      loadScenario: (scenario) => {
        const { socket } = get();
        if (socket) {
          socket.emit('load-scenario', scenario);
          set({ currentScenario: scenario });
        }
      },
      
      // Attack/Defense actions
      updateAttack: (attack) => 
        set((state) => ({
          attackState: { ...state.attackState, ...attack, isActive: true },
        })),
      
      updateDefense: (defense) =>
        set((state) => ({
          defenseState: { ...state.defenseState, ...defense, isActive: true },
        })),
      
      // Event handling
      addEvent: (event) =>
        set((state) => ({
          events: [
            {
              ...event,
              id: Date.now().toString(),
              timestamp: Date.now(),
            },
            ...state.events,
          ].slice(0, 1000),
        })),
      
      clearEvents: () => set({ events: [] }),
      
      // Server state
      updateServerState: (state) => set({ serverState: state }),
      
      // Initialization
      initialize: () => {
        const { connect } = get();
        connect();
        
        // Set up any other initialization logic here
      },
      
      // Cleanup
      cleanup: () => {
        const { disconnect } = get();
        disconnect();
      },
    }),
    {
      name: 'iot-simulation-storage',
      partialize: (state) => ({
        devices: state.devices,
        selectedDeviceId: state.selectedDeviceId,
        attackState: state.attackState,
        defenseState: state.defenseState,
        currentScenario: state.currentScenario,
        serverState: state.serverState,
      }),
    }
  )
);

export { useSimulationStore };
