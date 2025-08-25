import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SimulationEngine } from './simulation/engine';
import { SimulationState, SimulationEvent } from './types';

const PORT = process.env.PORT || 5050;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Vite dev server
    methods: ['GET', 'POST']
  }
});

// Initialize simulation
const simulation = new SimulationEngine();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/state', (req, res) => {
  res.json(simulation.getState());
});

app.get('/api/devices', (req, res) => {
  const state = simulation.getState();
  res.json({
    devices: state.devices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      firmwareVersion: device.firmwareVersion,
      weakPassword: device.weakPassword,
      openPorts: device.openPorts,
      compromised: device.compromised,
      integrityRisk: device.integrityRisk,
      riskScore: device.riskScore,
      metrics: device.metrics,
      lastUpdated: device.lastUpdated
    }))
  });
});

app.get('/api/devices/:id', (req, res) => {
  const device = simulation.getState().devices.find(d => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json(device);
});

// Simulation control endpoints
app.post('/api/sim/start', (req, res) => {
  simulation.start();
  res.json({ status: 'started' });
});

app.post('/api/sim/pause', (req, res) => {
  simulation.pause();
  res.json({ status: 'paused' });
});

app.post('/api/sim/reset', (req, res) => {
  simulation.reset();
  res.json({ status: 'reset' });
});

// Attack control endpoints
app.post('/api/attack/syn-flood', (req, res) => {
  const { intensity } = req.body;
  if (typeof intensity !== 'number' || intensity < 0 || intensity > 100) {
    return res.status(400).json({ error: 'Intensity must be a number between 0 and 100' });
  }
  simulation.setAttackState({ synFlood: intensity });
  res.json({ status: 'updated', attack: 'synFlood', intensity });
});

app.post('/api/attack/dictionary', (req, res) => {
  const { intensity } = req.body;
  if (typeof intensity !== 'number' || intensity < 0 || intensity > 100) {
    return res.status(400).json({ error: 'Intensity must be a number between 0 and 100' });
  }
  simulation.setAttackState({ dictionaryAttack: intensity });
  res.json({ status: 'updated', attack: 'dictionaryAttack', intensity });
});

app.post('/api/attack/mqtt-flood', (req, res) => {
  const { intensity } = req.body;
  if (typeof intensity !== 'number' || intensity < 0 || intensity > 100) {
    return res.status(400).json({ error: 'Intensity must be a number between 0 and 100' });
  }
  simulation.setAttackState({ mqttFlood: intensity });
  res.json({ status: 'updated', attack: 'mqttFlood', intensity });
});

app.post('/api/attack/firmware-tamper', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Enabled must be a boolean' });
  }
  simulation.setAttackState({ firmwareTamper: enabled });
  res.json({ status: 'updated', attack: 'firmwareTamper', enabled });
});

// Defense control endpoints
app.post('/api/defense/rate-limiting', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Enabled must be a boolean' });
  }
  simulation.setDefenseState({ rateLimiting: enabled });
  res.json({ status: 'updated', defense: 'rateLimiting', enabled });
});

app.post('/api/defense/account-lockout', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Enabled must be a boolean' });
  }
  simulation.setDefenseState({ accountLockout: enabled });
  res.json({ status: 'updated', defense: 'accountLockout', enabled });
});

app.post('/api/defense/signature-check', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Enabled must be a boolean' });
  }
  simulation.setDefenseState({ signatureCheck: enabled });
  res.json({ status: 'updated', defense: 'signatureCheck', enabled });
});

app.post('/api/sim/reset', (req, res) => {
  simulation.reset();
  res.json({ status: 'reset' });
});

app.post('/api/sim/attacks', (req, res) => {
  const { synFlood, dictionaryAttack, mqttFlood, firmwareTamper } = req.body;
  
  if (synFlood !== undefined || dictionaryAttack !== undefined || mqttFlood !== undefined || firmwareTamper !== undefined) {
    simulation.setAttackState({
      synFlood,
      dictionaryAttack,
      mqttFlood,
      firmwareTamper
    });
    res.json({ status: 'updated' });
  } else {
    res.status(400).json({ error: 'Invalid attack parameters' });
  }
});

app.post('/api/sim/defenses', (req, res) => {
  const { rateLimiting, accountLockout, signatureCheck } = req.body;
  
  if (rateLimiting !== undefined || accountLockout !== undefined || signatureCheck !== undefined) {
    simulation.setDefenseState({
      rateLimiting,
      accountLockout,
      signatureCheck
    });
    res.json({ status: 'updated' });
  } else {
    res.status(400).json({ error: 'Invalid defense parameters' });
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial state
  socket.emit('state', simulation.getState());
  
  // Handle simulation events
  const eventHandler = (event: SimulationEvent) => {
    socket.emit('event', event);
  };
  
  // Handle state updates
  const stateUpdateHandler = () => {
    socket.emit('state', simulation.getState());
  };
  
  simulation.addEventListener(eventHandler);
  
  // Subscribe to state updates
  const updateInterval = setInterval(() => {
    socket.emit('state', simulation.getState());
  }, 1000); // Update clients every second
  
  // Handle client requests
  socket.on('getState', () => {
    socket.emit('state', simulation.getState());
  });
  
  socket.on('startSimulation', () => {
    simulation.start();
    socket.emit('state', simulation.getState());
  });
  
  socket.on('pauseSimulation', () => {
    simulation.pause();
    socket.emit('state', simulation.getState());
  });
  
  socket.on('resetSimulation', () => {
    simulation.reset();
    socket.emit('state', simulation.getState());
  });
  
  socket.on('setAttack', (attack: Partial<AttackState>) => {
    simulation.setAttackState(attack);
    socket.emit('state', simulation.getState());
  });
  
  socket.on('setDefense', (defense: Partial<DefenseState>) => {
    simulation.setDefenseState(defense);
    socket.emit('state', simulation.getState());
  });
  
  // Handle device selection
  socket.on('device:select', (deviceId) => {
    const device = simulation.getState().devices.find(d => d.id === deviceId);
    if (device) {
      socket.emit('device:selected', device);
    }
  });
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    simulation.removeEventListener(eventHandler);
    clearInterval(updateInterval);
  });
});

// Subscribe to simulation updates
simulation.addEventListener((event) => {
  io.emit('event:new', event);
});

// Broadcast state updates at regular intervals
setInterval(() => {
  io.emit('state:update', simulation.getState());
}, 1000);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export {}; // Make this a module
