import { ReactNode, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { useToast } from '../components/ui/use-toast';

interface SimulationProviderProps {
  children: ReactNode;
  websocketUrl?: string;
}

export function SimulationProvider({ 
  children, 
  websocketUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001' 
}: SimulationProviderProps) {
  const { 
    isConnected, 
    connect, 
    disconnect, 
    initialize, 
    cleanup,
    addEvent,
  } = useSimulationStore();
  const { toast } = useToast();

  // Initialize store and connect to WebSocket
  useEffect(() => {
    // Initialize store with event listeners
    const cleanupStore = initialize();

    // Connect to WebSocket
    const connectToServer = async () => {
      try {
        await connect(websocketUrl);
        console.log('Connected to WebSocket server');
      } catch (error) {
        console.error('Failed to connect to WebSocket server:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to simulation server. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    connectToServer();

    // Cleanup on unmount
    return () => {
      cleanupStore();
      disconnect();
    };
  }, [connect, disconnect, initialize, websocketUrl, toast]);

  // Show connection status toasts
  useEffect(() => {
    if (isConnected) {
      toast({
        title: 'Connected',
        description: 'Connected to simulation server',
        variant: 'default',
      });
      
      addEvent({
        type: 'system',
        message: 'Connected to simulation server',
        severity: 'info',
      });
    } else {
      toast({
        title: 'Disconnected',
        description: 'Disconnected from simulation server',
        variant: 'destructive',
      });
      
      addEvent({
        type: 'system',
        message: 'Disconnected from simulation server',
        severity: 'error',
      });
    }
  }, [isConnected, toast, addEvent]);

  return <>{children}</>;
}
