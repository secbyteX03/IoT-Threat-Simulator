import { useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function SimulationInitializer({ children }: { children: React.ReactNode }) {
  const { 
    isConnected, 
    connect, 
    disconnect, 
    isSimulationRunning, 
    startSimulation, 
    stopSimulation,
    currentScenario,
    loadScenario,
    clearEvents,
    addEvent,
  } = useSimulation();
  
  const { toast } = useToast();
  
  // Try to connect on mount
  useEffect(() => {
    const init = async () => {
      try {
        await connect();
        
        // Add a welcome event
        addEvent({
          type: 'system',
          message: 'Simulation initialized',
          severity: 'info',
        });
        
        toast({
          title: 'Connected to Simulation',
          description: 'Successfully connected to the simulation server.',
        });
      } catch (error) {
        console.error('Failed to initialize simulation:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the simulation server. Please try again later.',
          variant: 'destructive',
        });
      }
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, toast, addEvent]);
  
  // Handle connection status changes
  useEffect(() => {
    if (!isConnected) {
      toast({
        title: 'Disconnected',
        description: 'Lost connection to the simulation server.',
        variant: 'destructive',
      });
    }
  }, [isConnected, toast]);
  
  // Show connection status banner
  const ConnectionStatus = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert variant={isConnected ? 'default' : 'destructive'} className="w-auto">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <AlertTitle className="font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </AlertTitle>
          <AlertDescription className="ml-2">
            {isConnected 
              ? 'Connected to simulation server' 
              : 'Not connected to simulation server'}
          </AlertDescription>
          {!isConnected && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => connect()}
            >
              Reconnect
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
  
  // Show simulation controls
  const SimulationControls = () => (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      <Button
        variant={isSimulationRunning ? 'destructive' : 'default'}
        onClick={() => isSimulationRunning ? stopSimulation() : startSimulation()}
        className="shadow-lg"
      >
        {isSimulationRunning ? 'Stop Simulation' : 'Start Simulation'}
      </Button>
      
      <Button
        variant="outline"
        onClick={() => {
          if (window.confirm('Are you sure you want to reset the simulation? This will clear all data.')) {
            clearEvents();
            // Additional reset logic can be added here
          }
        }}
      >
        Reset
      </Button>
      
      {currentScenario && (
        <div className="ml-4 flex items-center bg-background px-3 py-1.5 rounded-md border shadow-sm">
          <span className="text-sm font-medium">
            Scenario: <span className="text-primary">{currentScenario.name}</span>
          </span>
        </div>
      )}
    </div>
  );
  
  return (
    <>
      {children}
      <ConnectionStatus />
      <SimulationControls />
    </>
  );
}
