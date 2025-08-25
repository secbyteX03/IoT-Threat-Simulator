# IoT Threat Simulator

A real-time IoT threat simulation environment built with React, TypeScript, Node.js, and WebSockets. This tool helps you understand and visualize common IoT security threats in a safe, controlled environment with a responsive web interface.

## ✨ Features

- 🌐 **Real-time WebSocket Integration**: Live updates between server and client
- 📱 **Responsive Dashboard**: Works on desktop and tablet devices
- 🔄 **State Management**: Powered by Zustand for efficient state updates
- 🎨 **Modern UI**: Built with Tailwind CSS for a clean, responsive design

### 🎯 Attack Simulations
- **SYN Flood Attacks**: Simulate network flooding attacks
- **Dictionary Attacks**: Test credential stuffing attempts
- **MQTT Flood**: Overwhelm MQTT brokers with message floods
- **Firmware Tampering**: Detect unauthorized firmware modifications

### 🛡️ Defense Mechanisms
- **Rate Limiting**: Prevent request flooding
- **Account Lockout**: Block brute force attempts
- **Signature Verification**: Detect tampered firmware
- **Real-time Monitoring**: Track all security events

### 📊 Dashboard Features
- Live device metrics and status
- Interactive attack/defense controls
- Detailed event logging
- Device inspection panel
- Risk scoring and visualization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/iot-threat-simulator.git
   cd iot-threat-simulator
   ```

2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd apps/server
   npm install
   
   # Install web client dependencies
   cd ../web
   npm install
   ```

### Running the Application

1. Start the server:
   ```bash
   cd apps/server
   npm run dev
   ```

2. In a new terminal, start the web client:
2. In a new terminal, start the frontend development server:
   ```bash
   cd apps/web
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Usage

1. **Select a Scenario**:
   - Choose from predefined attack scenarios or create a custom one
   - Each scenario configures different attack vectors and defense mechanisms

2. **Monitor Devices**:
   - View real-time metrics for each IoT device
   - Check device status and security posture
   - Inspect detailed device information

3. **Analyze Attacks**:
   - Observe how different attacks affect device performance
   - Monitor network traffic and system resources
   - Review security events in the event log

4. **Test Defenses**:
   - Toggle different defense mechanisms
   - Observe their impact on attack mitigation
   - Compare effectiveness of different security controls

## Project Structure

```
iot-threat-simulator/
├── apps/
│   ├── server/           # Backend server (Node.js + Express + Socket.IO)
│   │   ├── src/
│   │   │   ├── simulation/  # Simulation engine
│   │   │   ├── routes/      # API routes
│   │   │   └── index.ts     # Server entry point
│   │   └── package.json
│   │
│   └── web/              # Frontend (React + TypeScript + Vite)
│       ├── public/       # Static assets
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── store/       # State management
│       │   └── App.tsx      # Main app component
│       └── package.json
│
├── package.json          # Root package.json (workspace config)
└── README.md            # This file
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by real-world IoT security challenges
- Special thanks to the open-source community for their amazing tools and libraries

## Disclaimer

This tool is for educational and research purposes only. The authors are not responsible for any misuse of this software. Always ensure you have proper authorization before testing any systems.

## Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.IO](https://socket.io/)
- [Recharts](https://recharts.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Hero Icons](https://heroicons.com/)
