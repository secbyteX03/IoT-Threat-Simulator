import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { AppProps } from '@/types';
import App from './App';
import './styles.css';

// Create a single socket instance
const socket: Socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Log socket connection status
socket.on('connect', () => {
  console.log('Connected to WebSocket server');});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create root and render the app
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App socket={socket} />
    </BrowserRouter>
  </React.StrictMode>
);
