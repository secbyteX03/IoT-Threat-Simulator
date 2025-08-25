import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Device } from '../../../server/src/types';
import StatusBadges from '../components/StatusBadges';

// Mock device data for testing
const createTestDevice = (overrides: Partial<Device> = {}): Device => ({
  id: 'test-device',
  name: 'Test Device',
  type: 'camera',
  firmwareVersion: '1.0.0',
  ip: '192.168.1.100',
  mac: '00:11:22:33:44:55',
  lastSeen: Date.now(),
  status: 'online',
  compromised: false,
  integrityRisk: false,
  weakPassword: false,
  metrics: {
    cpu: 30,
    mem: 40,
    netIn: 10,
    netOut: 5,
    battery: 80,
    msgRate: 5,
    failedAuth: 0,
    timestamp: Date.now()
  },
  ...overrides
});

describe('StatusBadges Component', () => {
  it('renders with default device', () => {
    const device = createTestDevice();
    render(<StatusBadges device={device} />);
    
    // Check for risk level badge
    expect(screen.getByText(/minimal risk/i)).toBeInTheDocument();
    
    // Check for CPU and Memory badges
    expect(screen.getByText(/30%/i)).toBeInTheDocument();
    expect(screen.getByText(/40%/i)).toBeInTheDocument();
    
    // Check for network activity
    expect(screen.getByText(/15.0kbps/i)).toBeInTheDocument();
    
    // Check for secure auth badge
    expect(screen.getByText(/secure auth/i)).toBeInTheDocument();
  });

  it('shows compromised status when device is compromised', () => {
    const device = createTestDevice({ compromised: true });
    render(<StatusBadges device={device} />);
    
    expect(screen.getByText(/compromised/i)).toBeInTheDocument();
    expect(screen.getByText(/high risk/i)).toBeInTheDocument();
  });

  it('shows weak password warning', () => {
    const device = createTestDevice({ weakPassword: true });
    render(<StatusBadges device={device} />);
    
    expect(screen.getByText(/weak auth/i)).toBeInTheDocument();
  });

  it('shows integrity risk warning', () => {
    const device = createTestDevice({ integrityRisk: true });
    render(<StatusBadges device={device} />);
    
    expect(screen.getByText(/integrity risk/i)).toBeInTheDocument();
  });

  it('shows high CPU usage warning', () => {
    const device = createTestDevice({ metrics: { cpu: 90 } });
    render(<StatusBadges device={device} />);
    
    const cpuBadge = screen.getByText(/90%/i).closest('span');
    expect(cpuBadge).toHaveClass('bg-red-100'); // or appropriate class for high CPU
  });

  it('shows battery level when available', () => {
    const device = createTestDevice({ metrics: { battery: 25 } });
    render(<StatusBadges device={device} />);
    
    expect(screen.getByText(/25%/i)).toBeInTheDocument();
  });

  it('applies custom className prop', () => {
    const device = createTestDevice();
    const { container } = render(
      <StatusBadges device={device} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
