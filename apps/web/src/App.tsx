import { useSimulationStore } from './store/useSimulationStore';
import Dashboard from './components/Dashboard';
import ConnectionStatus from './components/ConnectionStatus';
import { useSimulationSocket } from './hooks/useSimulationSocket';
import { Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { ThreatIntelligenceDashboard } from './components/dashboard/ThreatIntelligenceDashboard';
import { IconButton, Toolbar, AppBar, Box, CssBaseline, Tooltip, Typography } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface AppProps {
  socket: Socket;
}

// Create a theme instance.
const defaultTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App({ socket }: AppProps) {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  
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
    isSimulationRunning,
    devices,
    events
  } = useSimulationStore();

  // Initialize store and connect to WebSocket
  useEffect(() => {
    initialize();
    connect();
    
    return () => {
      disconnect();
    };
  }, [initialize, connect, disconnect]);
  
  const toggleDashboard = () => {
    setDashboardOpen(!dashboardOpen);
  };

  // Event handlers that use the store methods
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };
  
  // Event handlers that use the store methods
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  // Render the main application with dashboard toggle
  return (
    <ThemeProvider theme={defaultTheme}>
      {dashboardOpen ? (
        // Threat Intelligence Dashboard View
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <CssBaseline />
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Tooltip title="Back to Device Dashboard">
                <IconButton 
                  edge="start" 
                  color="inherit" 
                  onClick={toggleDashboard}
                  sx={{ mr: 2 }}
                >
                  <DashboardIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Threat Intelligence Dashboard
              </Typography>
              <ConnectionStatus connected={connected} />
            </Toolbar>
          </AppBar>
          <Box sx={{ flexGrow: 1, p: 3 }}>
            <ThreatIntelligenceDashboard 
              isOpen={dashboardOpen} 
              onClose={() => setDashboardOpen(false)} 
            />
          </Box>
        </Box>
      ) : (
        // Main Dashboard View
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <CssBaseline />
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                IoT Threat Simulator
              </Typography>
              <Tooltip title="View Threat Intelligence Dashboard">
                <IconButton 
                  color="inherit" 
                  onClick={toggleDashboard}
                  sx={{ mr: 1 }}
                >
                  <SecurityIcon />
                </IconButton>
              </Tooltip>
              <ConnectionStatus connected={connected} />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Dashboard 
              onDeviceSelect={handleDeviceSelect}
              onStartSimulation={startSimulation}
              onPauseSimulation={pauseSimulation}
              onResetSimulation={resetSimulation}
              onSetAttack={setAttack}
              onSetDefense={setDefense}
              onClearEvents={clearEvents}
              isSimulationRunning={isSimulationRunning}
            />
          </Box>
        </Box>
      )}
    </ThemeProvider>
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
