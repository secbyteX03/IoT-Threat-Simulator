import { useSimulationStore } from './store/useSimulationStore';
import Dashboard from './components/Dashboard';
import ConnectionStatus from './components/ConnectionStatus';
import { useSimulationSocket } from './hooks/useSimulationSocket';
import { Socket } from 'socket.io-client';
import { useEffect } from 'react';

interface AppProps {
  socket: Socket;
}

function App({ socket }: AppProps) {
  // Initialize WebSocket connection and get store actions
  const { connect, disconnect, initialize } = useSimulationStore();
  const { connected } = useSimulationSocket(socket);
  const { 
    startSimulation, 
    stopSimulation: pauseSimulation, 
    resetSimulation, 
    updateAttack: setAttack, 
    updateDefense: setDefense,
    selectDevice: setSelectedDevice,
    clearEvents,
    isSimulationRunning
  } = useSimulationStore();

  // Initialize store and connect to WebSocket
  useEffect(() => {
    initialize();
    connect();
    
    return () => {
      disconnect();
    };
  }, [initialize, connect, disconnect]);

  // Event handlers that use the store methods
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleAttackUpdate = (attack: any) => {
    setAttack(attack);
  };

  const handleDefenseUpdate = (defense: any) => {
    setDefense(defense);
  };

  const handleStartSimulation = () => {
    startSimulation();
  };

  const handlePauseSimulation = () => {
    pauseSimulation();
  };

  const handleResetSimulation = () => {
    clearEvents();
    resetSimulation();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">IoT Threat Simulator</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Dashboard
          onDeviceSelect={handleDeviceSelect}
          onAttackUpdate={handleAttackUpdate}
          onDefenseUpdate={handleDefenseUpdate}
          onStart={handleStartSimulation}
          onPause={handlePauseSimulation}
          onReset={handleResetSimulation}
        />
      </main>

      <ConnectionStatus />
      <SafetyBanner />
    </div>
  );
}

// Safety Banner Component
function SafetyBanner() {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-t border-yellow-200 dark:border-yellow-800 p-2 text-center text-sm text-yellow-800 dark:text-yellow-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <svg className="h-5 w-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Simulation only. No real network activity.</span>
        </div>
      </div>
    </div>
  );
}

export default App;
