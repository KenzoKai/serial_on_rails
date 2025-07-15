# Serial Device Manager

A comprehensive web-based application for managing and monitoring serial communication devices such as Arduino boards, ESP32 modules, sensors, and other USB-Serial devices.

## 🎯 Overview

The Serial Device Manager provides a modern, intuitive interface for discovering, connecting to, and communicating with serial devices. Built with Ruby on Rails and Node.js, it offers real-time communication capabilities through WebSocket connections and a professional dark-themed user interface.

## ✨ Key Features

### 🔍 **Device Discovery & Management**
- **Automatic Port Scanning**: Detects available serial ports and identifies device types
- **Smart Device Recognition**: Distinguishes between Arduino devices, USB-Serial adapters, and system ports
- **Device Profiles**: Save device configurations with custom names and connection settings
- **Persistent Storage**: SQLite database stores device configurations and communication history

### 🔗 **Real-Time Communication**
- **WebSocket Integration**: Live bidirectional communication with connected devices
- **Professional Console Interface**: Terminal-style output with color-coded messages and timestamps
- **Command Interface**: Send commands directly to connected devices
- **Auto-scrolling Output**: Automatic scrolling with manual override capability

### ⚙️ **Advanced Configuration**
- **Flexible Serial Settings**: Configure baud rate, data bits, stop bits, and parity
- **Multiple Device Support**: Manage multiple devices simultaneously
- **Connection Status Monitoring**: Real-time status indicators with visual feedback
- **Error Handling**: Comprehensive error reporting and recovery mechanisms

### 🎨 **Modern User Interface**
- **Professional Dark Theme**: Eye-friendly interface optimized for long development sessions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Clean, organized layout with clear visual hierarchy
- **Interactive Elements**: Hover effects, animations, and smooth transitions

## 🏗️ Architecture

### **Frontend (Rails)**
- **Ruby on Rails 8.0.2**: Modern web framework with Hotwire/Stimulus
- **Stimulus Controllers**: JavaScript behavior for interactive UI components
- **Bootstrap 5**: Responsive CSS framework with custom dark theme
- **Importmap**: Modern JavaScript module loading without bundling

### **Backend Services**
- **Node.js WebSocket Server**: Handles real-time serial communication on port 8081
- **SerialPort Library**: Cross-platform serial communication
- **SQLite Database**: Lightweight, file-based data storage
- **Rails API**: RESTful endpoints for device management

### **Data Models**
- **Device**: Serial device configurations and connection settings
- **Profile**: User-defined device profiles and preferences
- **SerialDatum**: Historical communication data and logging

## 🚀 Getting Started

### **Prerequisites**
- Ruby 3.1+ with Bundler
- Node.js 16+ with npm
- SQLite 3
- Serial devices (Arduino, ESP32, etc.)

### **Installation**

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd serial_on_rails
   ```

2. **Install Ruby Dependencies**
   ```bash
   bundle install
   ```

3. **Install Node.js Dependencies**
   ```bash
   cd node_server
   npm install
   cd ..
   ```

4. **Setup Database**
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed
   ```

5. **Start Services**
   
   **Terminal 1 - Rails Server:**
   ```bash
   rails server
   ```
   
   **Terminal 2 - WebSocket Server:**
   ```bash
   cd node_server
   node server.js
   ```

6. **Access Application**
   - Open browser to `http://localhost:3000`
   - Connect your serial devices via USB
   - Click "Scan Ports" to discover devices

### **Linux/WSL Serial Port Permissions**
```bash
# Add user to dialout group for serial port access
sudo usermod -a -G dialout $USER
# Logout and login again for changes to take effect
```

## 📱 Usage Guide

### **Discovering Devices**
1. Connect your serial device via USB
2. Click the "Scan Ports" button in the Available Serial Ports section
3. Review detected devices with their manufacturer information and port details

### **Adding Devices**
1. Select a discovered port by clicking "Select This Port"
2. Fill in the device configuration form:
   - **Device Name**: Custom identifier (e.g., "Arduino Uno - Temperature Sensor")
   - **Baud Rate**: Communication speed (common: 9600, 115200)
   - **Data/Stop/Parity**: Serial communication parameters
3. Save the device configuration

### **Connecting & Communication**
1. Click "Connect" next to a saved device
2. Monitor the real-time console for incoming data
3. Use the command input to send data to the device
4. View connection status in the top-right indicators

## 🔧 Configuration

### **Environment Variables**
Create a `.env` file in the project root:
```env
# WebSocket server configuration
WEBSOCKET_PORT=8081
WEBSOCKET_HOST=localhost

# Rails configuration
RAILS_ENV=development
SECRET_KEY_BASE=your_secret_key_here

# Database configuration (optional - defaults to SQLite)
DATABASE_URL=sqlite3:db/development.sqlite3
```

### **Serial Port Settings**
The application supports standard serial communication parameters:
- **Baud Rates**: 9600, 19200, 38400, 57600, 115200 bps
- **Data Bits**: 7, 8 bits
- **Stop Bits**: 1, 2 bits  
- **Parity**: None, Even, Odd

## 🧪 Development & Testing

### **Running Tests**
```bash
# Rails tests
rails test

# JavaScript tests (if implemented)
cd node_server
npm test
```

### **Code Style**
- **Ruby**: Follow Rails conventions and Rubocop guidelines
- **JavaScript**: ES6+ with consistent formatting
- **CSS**: BEM methodology with utility classes

### **Database Management**
```bash
# Create migration
rails generate migration AddFeatureToDevices feature:string

# Apply migrations
rails db:migrate

# Reset database
rails db:drop db:create db:migrate db:seed
```

## 🚀 Deployment

### **Production Setup**
1. **Environment Configuration**
   ```bash
   export RAILS_ENV=production
   export SECRET_KEY_BASE=$(rails secret)
   ```

2. **Database Preparation**
   ```bash
   rails db:create RAILS_ENV=production
   rails db:migrate RAILS_ENV=production
   ```

3. **Asset Compilation**
   ```bash
   rails assets:precompile
   ```

4. **Process Management**
   Consider using PM2 for Node.js and Systemd for Rails in production.

## 🔮 Future Expansion Possibilities

### **🎯 Immediate Enhancements**
- **Device Profiles Export/Import**: Backup and share device configurations
- **Data Logging & Export**: CSV/JSON export of communication history
- **Multiple Protocol Support**: I2C, SPI, CAN bus integration
- **Graphical Data Visualization**: Real-time charts and graphs for sensor data
- **Device Firmware Management**: Upload firmware to supported devices

### **🚀 Advanced Features**
- **IoT Integration**: MQTT broker support for IoT device communication
- **Cloud Connectivity**: Remote device access through secure tunnels
- **Multi-User Support**: User authentication and device sharing
- **Plugin Architecture**: Custom device drivers and communication protocols
- **Mobile Applications**: Native iOS/Android apps with Bluetooth support

### **📊 Analytics & Monitoring**
- **Performance Metrics**: Connection reliability, data throughput analysis
- **Device Health Monitoring**: Battery levels, signal strength, error rates
- **Historical Analysis**: Long-term data trends and pattern recognition
- **Alert System**: Email/SMS notifications for device events
- **Dashboard Creation**: Custom monitoring dashboards

### **🏢 Enterprise Features**
- **Device Fleet Management**: Manage hundreds of devices across locations
- **Role-Based Access Control**: Different permission levels for users
- **Audit Logging**: Complete history of user actions and device interactions
- **API Gateway**: RESTful API for third-party integrations
- **Database Scaling**: PostgreSQL/MySQL support for larger deployments

### **🔧 Technical Improvements**
- **WebRTC Integration**: Peer-to-peer device communication
- **Container Deployment**: Docker and Kubernetes support
- **Microservices Architecture**: Separate services for different device types
- **Real-Time Collaboration**: Multiple users working with the same device
- **Advanced Security**: TLS encryption, device certificates, secure boot

### **🌐 Protocol Extensions**
- **Modbus Support**: Industrial automation device communication
- **TCP/UDP Sockets**: Network-based device communication
- **Bluetooth/WiFi**: Wireless device discovery and communication
- **USB HID**: Human Interface Device support
- **Custom Protocols**: Framework for implementing proprietary protocols

### **📱 Integration Possibilities**
- **Home Assistant**: Smart home integration
- **Node-RED**: Visual programming for IoT workflows
- **Grafana**: Advanced data visualization and alerting
- **InfluxDB**: Time-series database for sensor data
- **Slack/Discord**: Team notifications and device status updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join discussions in GitHub Discussions

## 🙏 Acknowledgments

- **SerialPort Library**: Cross-platform serial communication
- **Ruby on Rails Community**: Excellent web framework and ecosystem
- **Bootstrap Team**: Responsive CSS framework
- **FontAwesome**: Beautiful icons for the interface

---

**Built with ❤️ for the maker community and IoT developers**
