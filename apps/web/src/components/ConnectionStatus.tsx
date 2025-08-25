import React from 'react';
import { useSimulationSocket } from '../hooks/useSimulationSocket';

const ConnectionStatus: React.FC = () => {
  const { connected } = useSimulationSocket();

  return (
    <div className="fixed bottom-4 right-4 flex items-center space-x-2 px-4 py-2 rounded-lg bg-white shadow-md">
      <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm font-medium">
        {connected ? 'Connected to server' : 'Disconnected'}
      </span>
    </div>
  );
};

export default ConnectionStatus;
