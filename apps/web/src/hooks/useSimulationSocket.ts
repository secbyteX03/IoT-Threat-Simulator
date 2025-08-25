import { useEffect } from 'react';
import useStore from '../store';

export const useSimulationSocket = () => {
  const connectSocket = useStore(state => state.connectSocket);
  const disconnectSocket = useStore(state => state.disconnectSocket);
  const fetchDevices = useStore(state => state.fetchDevices);
  const connected = useStore(state => state.connected);

  useEffect(() => {
    // Connect to WebSocket server when the component mounts
    connectSocket();
    
    // Initial data fetch
    fetchDevices().catch(console.error);
    
    // Clean up on unmount
    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket, fetchDevices]);

  return { connected };
};
