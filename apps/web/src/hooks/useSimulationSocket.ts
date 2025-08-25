import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import useStore from '../store';

export const useSimulationSocket = (socket?: Socket) => {
  const connectSocket = useStore(state => state.connectSocket);
  const disconnectSocket = useStore(state => state.disconnectSocket);
  const fetchDevices = useStore(state => state.fetchDevices);
  const connected = useStore(state => state.connected);
  const setSocket = useStore(state => state.setSocket);

  useEffect(() => {
    if (socket) {
      // Set the socket in the store if provided
      setSocket(socket);
      
      // Connect to WebSocket server
      connectSocket();
      
      // Initial data fetch
      fetchDevices().catch(console.error);
    }
    
    // Clean up on unmount
    return () => {
      if (socket) {
        disconnectSocket();
      }
    };
  }, [socket, connectSocket, disconnectSocket, fetchDevices, setSocket]);

  return { connected };
};
