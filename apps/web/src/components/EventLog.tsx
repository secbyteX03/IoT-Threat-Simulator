import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  ShieldExclamationIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store';

const EventLog = () => {
  const events = useStore((state) => state.events);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'info', 'warning', 'alert'
    device: 'all',
    search: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const state = useStore();

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    scrollToBottom();
  }, [events]);

  const scrollToBottom = () => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter events based on active filters
  const filteredEvents = events.filter((event) => {
    // Filter by type
    if (filters.type !== 'all' && event.type !== filters.type) {
      return false;
    }
    
    // Filter by device
    if (filters.device !== 'all' && event.deviceId !== filters.device) {
      return false;
    }
    
    // Filter by search term
    if (
      filters.search &&
      !event.message.toLowerCase().includes(filters.search.toLowerCase()) &&
      !event.deviceName.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    
    return true;
  });

  // Get unique device names for filter dropdown
  const deviceNames = Array.from(
    new Set(events.map((event) => event.deviceName).filter(Boolean))
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <ShieldExclamationIcon className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const clearEvents = () => {
    if (window.confirm('Are you sure you want to clear all events?')) {
      state.clearEvents();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Event Log Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Event Log
          </h3>
          <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-1 rounded-md ${
              isFilterOpen
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300'
            }`}
            title="Filter events"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={clearEvents}
            className="p-1 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
            title="Clear all events"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-gray-200 dark:border-gray-700"
          >
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'info', label: 'Info' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'alert', label: 'Alert' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFilters({ ...filters, type: type.value as any })}
                      className={`text-xs px-2 py-1 rounded ${
                        filters.type === type.value
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device
                </label>
                <div className="relative">
                  <select
                    value={filters.device}
                    onChange={(e) => setFilters({ ...filters, device: e.target.value })}
                    className="block w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Devices</option>
                    {deviceNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search events..."
                    className="block w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredEvents.length > 0 ? (
          <AnimatePresence initial={false}>
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`p-3 rounded-md ${getEventColor(event.type)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.deviceName || 'System'}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        <span>{formatTimestamp(event.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">
                      {event.message}
                    </p>
                    {event.details && (
                      <div className="mt-1">
                        <pre className="text-xs bg-black/5 dark:bg-white/10 p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={eventsEndRef} />
          </AnimatePresence>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
            <InformationCircleIcon className="h-8 w-8 mb-2" />
            <p className="text-sm">
              {events.length === 0
                ? 'No events recorded yet. Start the simulation to see events.'
                : 'No events match your filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLog;
