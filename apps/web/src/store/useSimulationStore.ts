import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Device, AttackState, DefenseState, SimulationEvent, SimulationScenario } from '../../../server/src/types';
import { SimulationService } from '../services/simulationService';

interface SimulationState {
  // Connection state
  isConnected: boolean;
  isSimulationRunning: boolean;
  
  // Data state
  devices: Device[];
  selectedDeviceId: string | null;
  events: SimulationEvent[];
  attackState: AttackState;
  defenseState: DefenseState;
  currentScenario: SimulationScenario | null;
  
  // Service instance
  simulationService: SimulationService;
  
  // Actions
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  
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
  
  // Initialization
  initialize: () => void;
  cleanup: () => void;
}

const defaultAttackState: AttackState = {
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
  lastUpdated: new Date().toISOString(),
};

// Create the store with persistence for certain state
const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => {
      // Initialize service
      const simulationService = SimulationService.getInstance();
      
      // Helper to safely update state
      const safeSet = (updater: (state: SimulationState) => Partial<SimulationState>) => {
        set((state) => ({
          ...state,
          ...updater(state),
        }));
      };
      
      return {
        // Initial state
        isConnected: false,
        isSimulationRunning: false,
        devices: [],
        selectedDeviceId: null,
        events: [],
        attackState: { ...defaultAttackState },
        defenseState: { ...defaultDefenseState },
        currentScenario: null,
        simulationService,
        
        // Actions
        connect: async (url = '/') => {
          try {
            await simulationService.connect(url);
            set({ isConnected: true });
          } catch (error) {
            console.error('Failed to connect to simulation server:', error);
            throw error;
          }
        },
        
        disconnect: () => {
          simulationService.disconnect();
          set({ isConnected: false });
        },
        
        selectDevice: (deviceId) => {
          set({ selectedDeviceId: deviceId });
          
          // Subscribe to metrics for the selected device
          if (deviceId) {
            simulationService.subscribeToMetrics(deviceId, [
              'cpu', 'memory', 'networkIn', 'networkOut', 'battery'
            ]);
          }
        },
        
        updateDevice: (device) => {
          set((state) => ({
            devices: state.devices.map((d) => 
              d.id === device.id ? { ...d, ...device } : d
            ),
          }));
        },
        
        startSimulation: () => {
          simulationService.startSimulation();
          set({ isSimulationRunning: true });
        },
        
        stopSimulation: () => {
          simulationService.stopSimulation();
          set({ isSimulationRunning: false });
        },
        
        resetSimulation: () => {
          simulationService.resetSimulation();
          set({
            devices: [],
            selectedDeviceId: null,
            attackState: { ...defaultAttackState },
            defenseState: { ...defaultDefenseState },
            currentScenario: null,
            isSimulationRunning: false,
          });
        },
        
        loadScenario: (scenario) => {
          simulationService.loadScenario(scenario);
          set({ currentScenario: scenario });
        },
        
        updateAttack: (attack) => {
          simulationService.updateAttack(attack);
          set((state) => ({
            attackState: { ...state.attackState, ...attack },
          }));
        },
        
        updateDefense: (defense) => {
          simulationService.updateDefense(defense);
          set((state) => ({
            defenseState: { ...state.defenseState, ...defense },
          }));
        },
        
        addEvent: (event) => {
          const newEvent: SimulationEvent = {
            ...event,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          };
          
          set((state) => ({
            events: [newEvent, ...state.events].slice(0, 1000), // Keep last 1000 events
          }));
        },
        
        clearEvents: () => {
          set({ events: [] });
        },
        
        // Initialize the store with event listeners
        initialize: () => {
          const { simulationService } = get();
          
          // Set up event listeners
          const unsubscribers = [
            // Connection status
            simulationService.onConnect(() => set({ isConnected: true })),
            simulationService.onDisconnect(() => set({ isConnected: false })),
            
            // Device updates
            simulationService.onDevicesUpdate((devices) => {
              set((state) => ({
                devices: devices.map(device => ({
                  ...device,
                  // Preserve local state if device was updated
                  ...state.devices.find(d => d.id === device.id)
                }))
              }));
            }),
            
            simulationService.onDeviceUpdate((device) => {
              set((state) => ({
                devices: state.devices.map((d) => 
                  d.id === device.id ? { ...d, ...device } : d
                ),
              }));
            }),
            
            // Simulation control
            simulationService.onSimulationStart(() => {
              set({ isSimulationRunning: true });
              get().addEvent({
                type: 'system',
                message: 'Simulation started',
                severity: 'info',
              });
            }),
            
            simulationService.onSimulationStop(() => {
              set({ isSimulationRunning: false });
              get().addEvent({
                type: 'system',
                message: 'Simulation stopped',
                severity: 'info',
              });
            }),
            
            // Attack/Defense updates
            simulationService.onAttackUpdate((attack) => {
              set((state) => ({
                attackState: { ...state.attackState, ...attack },
              }));
              
              if (attack.attackType) {
                get().addEvent({
                  type: 'attack',
                  message: `Attack started: ${attack.attackType}`,
                  severity: 'high',
                  deviceId: attack.targetDeviceId || undefined,
                });
              }
            }),
            
            simulationService.onDefenseUpdate((defense) => {
              set((state) => ({
                defenseState: { ...state.defenseState, ...defense },
              }));
              
              get().addEvent({
                type: 'defense',
                message: 'Defense configuration updated',
                severity: 'info',
              });
            }),
            
            // Scenario loaded
            simulationService.onScenarioLoaded((scenario) => {
              set({ currentScenario: scenario });
              get().addEvent({
                type: 'system',
                message: `Scenario loaded: ${scenario.name}`,
                severity: 'info',
              });
            }),
            
            // Custom events
            simulationService.onEvent((event) => {
              get().addEvent(event);
            }),
          ];
          
          // Cleanup function
          return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
            simulationService.disconnect();
          };
        },
        
        // Cleanup function
        cleanup: () => {
          simulationService.disconnect();
        },
      };
    },
    {
      name: 'iot-simulation-storage',
      partialize: (state) => ({
        // Persist these fields
        devices: state.devices,
        attackState: state.attackState,
        defenseState: state.defenseState,
        currentScenario: state.currentScenario,
      }),
    }
  )
);

export { useSimulationStore };
