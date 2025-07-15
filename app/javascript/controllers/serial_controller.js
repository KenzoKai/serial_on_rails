import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="serial"
export default class extends Controller {
  static targets = [ 
    "deviceList", "mainContent", "availablePorts", "deviceForm", 
    "commandInput", "autoScrollButton" 
  ]

  connect() {
    console.log('Serial controller connected');
    this.autoScroll = true;
    this.connectedDevice = null;
    this.availablePorts = [];
    this.loadDevices();
    this.initWebSocket();
  }

  initWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8081`;
    console.log('Connecting to WebSocket server at:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.handleError('Failed to create WebSocket connection');
      return;
    }

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.updateStatus('Connected to WebSocket server');
      this.listPorts();
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      this.updateStatus('Disconnected from WebSocket server');
      // Try to reconnect after 3 seconds
      setTimeout(() => this.initWebSocket(), 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('WebSocket error - check console for details');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      
      switch (data.type) {
        case 'ports':
          this.handlePortsList(data.ports);
          break;
        case 'connected':
          this.handleConnected(data);
          break;
        case 'data':
          this.handleData(data.data);
          break;
        case 'error':
          this.handleError(data.error);
          break;
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.mainContentTarget.innerHTML += '<p>Disconnected from WebSocket server</p>';
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError('Failed to connect to WebSocket server');
    };
  }

  async listPorts() {
    try {
      this.ws.send(JSON.stringify({ type: 'list_ports' }));
    } catch (error) {
      console.error('Error listing ports:', error);
      this.handleError('Failed to list serial ports');
    }
  }

  handlePortsList(ports) {
    console.log('Available ports:', ports);
    this.availablePorts = ports;
    this.displayAvailablePorts(ports);
    this.updatePortSelectors(ports);
  }

  connectToPort(portName, settings = {}) {
    const options = {
      baudRate: settings.baud_rate || 9600,
      dataBits: settings.data_bits || 8,
      stopBits: settings.stop_bits || 1,
      parity: settings.parity || 'none'
    };

    this.ws.send(JSON.stringify({
      type: 'connect',
      port: portName,
      options: options
    }));

    this.addConsoleMessage(`Connecting to ${portName}...`, 'info');
  }

  handleConnected(data) {
    this.connectedDevice = { port: data.port, device_id: this.pendingDeviceId };
    this.updateStatus(`Connected to ${data.port}`);
    this.addConsoleMessage(`Connected to ${data.port}`, 'success');
    this.loadDevices(); // Refresh device list to show updated status
  }

  handleData(data) {
    this.addConsoleMessage(`RX: ${data}`, 'receive');
    
    // Log data to Rails backend if we have a connected device
    if (this.connectedDevice) {
      this.logSerialData(data, 'rx');
    }
  }

  handleError(error) {
    console.error('Error:', error);
    this.addConsoleMessage(`ERROR: ${error}`, 'error');
    this.updateStatus(`Error: ${error}`);
  }

  updateStatus(message) {
    const statusDiv = document.getElementById('connection-status') || document.createElement('div');
    statusDiv.id = 'connection-status';
    statusDiv.className = 'alert alert-info';
    statusDiv.textContent = message;
    
    if (!document.getElementById('connection-status')) {
      this.mainContentTarget.prepend(statusDiv);
    }
  }

  // New UI Methods
  refreshPorts() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.listPorts();
    } else {
      this.handleError('WebSocket not connected. Cannot scan for ports.');
    }
  }

  displayAvailablePorts(ports) {
    let html = '';
    if (ports.length === 0) {
      html = '<div class="col-12"><p class="text-muted">No serial ports found.</p></div>';
    } else {
      ports.forEach(port => {
        html += `
          <div class="col-md-4 mb-3">
            <div class="card border-secondary">
              <div class="card-body">
                <h6 class="card-title">${port.path}</h6>
                <p class="card-text small text-muted">
                  ${port.manufacturer || 'Unknown'}<br>
                  ${port.productId ? 'PID: ' + port.productId : ''}
                </p>
              </div>
            </div>
          </div>
        `;
      });
    }
    this.availablePortsTarget.innerHTML = html;
  }

  updatePortSelectors(ports) {
    const portSelect = document.getElementById('device-port');
    if (portSelect) {
      portSelect.innerHTML = '<option value="">Select a port...</option>';
      ports.forEach(port => {
        const option = document.createElement('option');
        option.value = port.path;
        option.textContent = `${port.path} - ${port.manufacturer || 'Unknown'}`;
        portSelect.appendChild(option);
      });
    }
  }

  showAddDeviceForm() {
    document.getElementById('new-device-form').style.display = 'block';
    // Refresh ports when showing the form
    this.refreshPorts();
  }

  cancelAddDevice() {
    document.getElementById('new-device-form').style.display = 'none';
    this.deviceFormTarget.reset();
  }

  async saveDevice(event) {
    event.preventDefault();
    const formData = new FormData(this.deviceFormTarget);
    const deviceData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        body: JSON.stringify({ device: deviceData })
      });

      if (response.ok) {
        this.cancelAddDevice();
        this.loadDevices();
        this.addConsoleMessage(`Device '${deviceData.name}' saved successfully`, 'success');
      } else {
        const errorData = await response.json();
        this.handleError('Failed to save device: ' + Object.values(errorData).flat().join(', '));
      }
    } catch (error) {
      this.handleError('Error saving device: ' + error.message);
    }
  }

  async connectToDevice(deviceId) {
    try {
      const response = await fetch(`/devices/${deviceId}/connect`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.getCsrfToken()
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.pendingDeviceId = deviceId; // Store device ID for connection callback
        this.connectToPort(data.connection_settings.port, data.connection_settings);
      } else {
        const errorData = await response.json();
        this.handleError(errorData.error);
      }
    } catch (error) {
      this.handleError('Error connecting to device: ' + error.message);
    }
  }

  async disconnectFromDevice(deviceId) {
    try {
      // Disconnect from WebSocket first
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'disconnect' }));
      }

      // Update device status in Rails
      const response = await fetch(`/devices/${deviceId}/disconnect`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.getCsrfToken()
        }
      });

      if (response.ok) {
        this.connectedDevice = null;
        this.loadDevices();
        this.addConsoleMessage('Device disconnected', 'info');
        this.updateStatus('Disconnected');
      }
    } catch (error) {
      this.handleError('Error disconnecting: ' + error.message);
    }
  }

  async deleteDevice(deviceId) {
    if (confirm('Are you sure you want to delete this device?')) {
      try {
        const response = await fetch(`/devices/${deviceId}`, {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': this.getCsrfToken()
          }
        });

        if (response.ok) {
          this.loadDevices();
          this.addConsoleMessage('Device deleted', 'info');
        }
      } catch (error) {
        this.handleError('Error deleting device: ' + error.message);
      }
    }
  }

  async loadDevices() {
    console.log('Loading devices...');
    try {
      const response = await fetch('/devices.json');
      const devices = await response.json();
      console.log('Loaded devices:', devices);
      let deviceListHtml = '';
      
      if (devices.length > 0) {
        devices.forEach(device => {
          const statusClass = device.status === 'connected' ? 'success' : 
                             device.status === 'error' ? 'danger' : 'secondary';
          const statusText = device.status.charAt(0).toUpperCase() + device.status.slice(1);
          
          const connectButton = device.status === 'connected' ? 
            `<button class="btn btn-outline-danger btn-sm" data-action="click->serial#disconnectFromDeviceHandler" data-device-id="${device.id}">Disconnect</button>` :
            `<button class="btn btn-outline-success btn-sm" data-action="click->serial#connectToDeviceHandler" data-device-id="${device.id}">Connect</button>`;
          
          deviceListHtml += `
            <tr>
              <td><strong>${device.name}</strong></td>
              <td><code>${device.port}</code></td>
              <td><span class="badge bg-${statusClass}">${statusText}</span></td>
              <td><small>${device.baud_rate || 9600} baud, ${device.data_bits || 8}-${device.parity || 'N'}-${device.stop_bits || 1}</small></td>
              <td>
                <div class="btn-group">
                  ${connectButton}
                  <button class="btn btn-outline-danger btn-sm" data-action="click->serial#deleteDeviceHandler" data-device-id="${device.id}">Delete</button>
                </div>
              </td>
            </tr>
          `;
        });
      } else {
        deviceListHtml = '<tr><td colspan="5" class="text-center text-muted">No saved devices. Click "Add Device" to get started.</td></tr>';
      }
      
      this.deviceListTarget.innerHTML = deviceListHtml;
    } catch (error) {
      console.error('Error loading devices:', error);
      this.deviceListTarget.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading devices</td></tr>';
    }
  }

  // Console and Communication Methods
  addConsoleMessage(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '#00aaff',
      success: '#00ff00', 
      error: '#ff4444',
      receive: '#ffff00',
      send: '#ff9900'
    };
    
    const messageElement = document.createElement('div');
    messageElement.style.color = colors[type] || '#ffffff';
    messageElement.innerHTML = `<span style="color: #888">[${timestamp}]</span> ${message}`;
    
    this.mainContentTarget.appendChild(messageElement);
    
    if (this.autoScroll) {
      this.mainContentTarget.scrollTop = this.mainContentTarget.scrollHeight;
    }
  }

  clearConsole() {
    this.mainContentTarget.innerHTML = '<div class="text-muted">Console cleared...</div>';
  }

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
    const button = this.autoScrollButtonTarget;
    button.innerHTML = this.autoScroll ? 
      '<i class="fas fa-arrow-down"></i> Auto-scroll: ON' : 
      '<i class="fas fa-arrow-down"></i> Auto-scroll: OFF';
  }

  handleCommandInput(event) {
    if (event.key === 'Enter') {
      this.sendCommand();
    }
  }

  sendCommand() {
    const command = this.commandInputTarget.value.trim();
    if (command && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'write',
        data: command + '\n'
      }));
      
      this.addConsoleMessage(`TX: ${command}`, 'send');
      
      // Log sent data to Rails backend if we have a connected device
      if (this.connectedDevice) {
        this.logSerialData(command, 'tx');
      }
      
      this.commandInputTarget.value = '';
    }
  }

  // Data logging method
  async logSerialData(data, direction) {
    if (!this.connectedDevice) return;
    
    try {
      await fetch(`/devices/${this.connectedDevice.device_id}/serial_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        body: JSON.stringify({
          serial_datum: {
            data: data,
            direction: direction
          }
        })
      });
    } catch (error) {
      console.error('Error logging serial data:', error);
    }
  }

  // Event Handlers for Device Actions
  connectToDeviceHandler(event) {
    const deviceId = event.currentTarget.dataset.deviceId;
    this.connectToDevice(deviceId);
  }

  disconnectFromDeviceHandler(event) {
    const deviceId = event.currentTarget.dataset.deviceId;
    this.disconnectFromDevice(deviceId);
  }

  deleteDeviceHandler(event) {
    const deviceId = event.currentTarget.dataset.deviceId;
    this.deleteDevice(deviceId);
  }

  getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  }
}
