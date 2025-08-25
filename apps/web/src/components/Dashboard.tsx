import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Device } from '../../../server/src/types';
import DeviceList from './DeviceList';
import AttackControls from './AttackControls';
import DefenseControls from './DefenseControls';
import ScenarioSelector from './ScenarioSelector';
import LiveCharts from './LiveCharts';
import EventLog from './EventLog';
import DeviceInspector from './DeviceInspector';
import { useStore } from '../store';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface DashboardProps {
  onDeviceSelect: (deviceId: string) => void;
  onAttackUpdate: (attack: any) => void;
  onDefenseUpdate: (defense: any) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onDeviceSelect,
  onAttackUpdate,
  onDefenseUpdate,
  onStart,
  onPause,
  onReset,
}) => {
  const { state, selectedDeviceId, getSelectedDevice } = useStore();
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const selectedDevice = getSelectedDevice();

  // Auto-select first device if none selected
  useEffect(() => {
    if (state.devices.length > 0 && !selectedDeviceId) {
      onDeviceSelect(state.devices[0].id);
    }
  }, [state.devices, selectedDeviceId, onDeviceSelect]);

  const handleDeviceClick = (deviceId: string) => {
    onDeviceSelect(deviceId);
  };

  const handleInspectDevice = (deviceId: string) => {
    onDeviceSelect(deviceId);
    setIsInspectorOpen(true);
  };

  const handleAttackChange = (attack: any) => {
    onAttackUpdate(attack);
  };

  const handleDefenseChange = (defense: any) => {
    onDefenseUpdate(defense);
  };

  const handleScenarioSelect = (scenario: any) => {
    // Apply scenario-specific settings
    if (scenario.attack) onAttackUpdate(scenario.attack);
    if (scenario.defense) onDefenseUpdate(scenario.defense);
    if (scenario.start) onStart();
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Devices</h2>
          <DeviceList 
            devices={state.devices} 
            selectedDeviceId={selectedDeviceId}
            onSelect={handleDeviceClick}
            onInspect={handleInspectDevice}
          />
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <ScenarioSelector onSelect={handleScenarioSelect} />
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <AttackControls 
            attack={state.attack}
            onChange={handleAttackChange}
          />
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <DefenseControls 
            defense={state.defense}
            onChange={handleDefenseChange}
          />
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            {state.running ? (
              <button
                onClick={onPause}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <PauseIcon className="h-4 w-4 mr-2" />
                Pause
              </button>
            ) : (
              <button
                onClick={onStart}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start
              </button>
            )}
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Charts Section */}
        <div className="flex-1 overflow-auto p-4">
          {selectedDevice ? (
            <LiveCharts device={selectedDevice} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Select a device to view metrics</p>
            </div>
          )}
        </div>
        
        {/* Event Log Section */}
        <div className="h-1/3 border-t border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Event Log</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <EventLog />
          </div>
        </div>
      </div>

      {/* Device Inspector Modal */}
      <AnimatePresence>
        {isInspectorOpen && selectedDevice && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto"
          >
            <DeviceInspector 
              device={selectedDevice} 
              onClose={() => setIsInspectorOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
