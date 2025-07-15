import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["deviceList", "deviceForm"]

  connect() {
    console.log('Simple Serial controller connected!');
    
    // Store element references
    const allTargets = this.element.querySelectorAll('[data-simple-serial-target]');
    allTargets.forEach((target) => {
      const targetName = target.getAttribute('data-simple-serial-target');
      if (targetName === 'deviceList') {
        this.deviceListElement = target;
      } else if (targetName === 'deviceForm') {
        this.deviceFormElement = target;
      }
    });
    
    this.loadDevices();
    this.initWebSocket();
  }

  async loadDevices() {
    console.log('Loading devices...');
    
    try {
      const response = await fetch('/devices.json');
      const devices = await response.json();
      console.log('Loaded devices:', devices);
      
      this.displayDevices(devices);
    } catch (error) {
      console.error('Error loading devices:', error);
      this.deviceListTarget.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading devices: ' + error.message + '</td></tr>';
    }
  }

  displayDevices(devices) {
    console.log('Displaying devices:', devices);
    
    // Use stored element reference
    if (this.deviceListElement) {
      console.log('Using stored deviceList element:', this.deviceListElement);
      this.updateDeviceTable(this.deviceListElement, devices);
      return;
    }
    
    console.error('No stored deviceList element found!');
    return;
    
    let deviceListHtml = '';
    
    if (devices.length > 0) {
      devices.forEach(device => {
        const statusClass = device.status === 'connected' ? 'success' : 
                           device.status === 'error' ? 'danger' : 'secondary';
        const statusText = device.status.charAt(0).toUpperCase() + device.status.slice(1);
        
        deviceListHtml += `
          <tr>
            <td><strong>${device.name}</strong></td>
            <td><code>${device.port}</code></td>
            <td><span class="badge bg-${statusClass}">${statusText}</span></td>
            <td><small>${device.baud_rate || 9600} baud, ${device.data_bits || 8}-${device.parity || 'N'}-${device.stop_bits || 1}</small></td>
            <td>
              <div class="btn-group">
                <button class="btn btn-outline-success btn-sm" 
                        data-action="click->simple-serial#connectToDevice" 
                        data-device-id="${device.id}">Connect</button>
                <button class="btn btn-outline-danger btn-sm" 
                        data-action="click->simple-serial#deleteDevice" 
                        data-device-id="${device.id}">Delete</button>
              </div>
            </td>
          </tr>
        `;
      });
    } else {
      deviceListHtml = '<tr><td colspan="5" class="text-center text-muted">No saved devices. Click "Add Device" to get started.</td></tr>';
    }
    
    console.log('Setting innerHTML:', deviceListHtml);
    this.deviceListTarget.innerHTML = deviceListHtml;
    console.log('Device list updated successfully!');
  }

  updateDeviceTable(target, devices) {
    let deviceListHtml = '';
    
    if (devices.length > 0) {
      devices.forEach(device => {
        const statusClass = device.status === 'connected' ? 'success' : 
                           device.status === 'error' ? 'danger' : 'secondary';
        const statusText = device.status.charAt(0).toUpperCase() + device.status.slice(1);
        const statusIcon = device.status === 'connected' ? 'fa-check-circle' : 
                          device.status === 'error' ? 'fa-exclamation-triangle' : 'fa-circle';
        
        deviceListHtml += `
          <tr class="device-row">
            <td class="px-4 py-3">
              <div class="d-flex align-items-center">
                <i class="fas fa-microchip me-2 text-info"></i>
                <div>
                  <strong class="d-block">${device.name}</strong>
                  <small class="text-muted">Device</small>
                </div>
              </div>
            </td>
            <td class="px-3 py-3">
              <code class="bg-dark px-2 py-1 rounded">${device.port}</code>
            </td>
            <td class="px-3 py-3">
              <span class="badge bg-${statusClass} d-flex align-items-center justify-content-center" style="width: fit-content;">
                <i class="fas ${statusIcon} me-1" style="font-size: 0.7rem;"></i>
                ${statusText}
              </span>
            </td>
            <td class="px-3 py-3">
              <div class="small">
                <div><i class="fas fa-tachometer-alt me-1 text-muted"></i>${device.baud_rate || 9600} bps</div>
                <div class="text-muted">${device.data_bits || 8}-${device.parity || 'N'}-${device.stop_bits || 1}</div>
              </div>
            </td>
            <td class="px-3 py-3 text-center">
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-success" 
                        data-action="click->simple-serial#connectToDevice" 
                        data-device-id="${device.id}"
                        title="Connect to device">
                  <i class="fas fa-plug me-1"></i>Connect
                </button>
                <button class="btn btn-outline-danger" 
                        data-action="click->simple-serial#deleteDevice" 
                        data-device-id="${device.id}"
                        title="Delete device">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    } else {
      deviceListHtml = `
        <tr>
          <td colspan="5" class="text-center py-5">
            <div class="d-flex flex-column align-items-center">
              <i class="fas fa-inbox text-muted mb-3" style="font-size: 2rem;"></i>
              <p class="text-muted mb-2">No saved devices found</p>
              <small class="text-muted">Click "Add Device" above to get started</small>
            </div>
          </td>
        </tr>
      `;
    }
    
    target.innerHTML = deviceListHtml;
    console.log('Device list updated with enhanced styling!');
  }

  // WebSocket functionality
  initWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8081`;
    console.log('Connecting to WebSocket server at:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.updateStatus('Failed to create WebSocket connection');
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
  }

  async listPorts() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'list_ports' }));
    }
  }

  handlePortsList(ports) {
    console.log('Available ports:', ports);
    this.displayAvailablePorts(ports);
  }

  displayAvailablePorts(ports) {
    const portsContainer = this.element.querySelector('.card .card-body');
    let html = '';
    
    if (ports.length === 0) {
      html = `
        <div class="col-12">
          <div class="text-center py-4">
            <i class="fas fa-exclamation-triangle text-warning mb-2" style="font-size: 2rem;"></i>
            <p class="text-muted mb-2">No serial ports detected</p>
            <small class="text-muted">Make sure your USB-Serial device is connected and try scanning again</small>
          </div>
        </div>
      `;
    } else {
      ports.forEach(port => {
        const isUsb = port.manufacturer && (port.manufacturer.toLowerCase().includes('ftdi') || 
                     port.manufacturer.toLowerCase().includes('prolific') ||
                     port.manufacturer.toLowerCase().includes('usb') ||
                     port.manufacturer.toLowerCase().includes('arduino') ||
                     port.vendorId || port.productId);
        
        // Better icon selection based on device type
        let deviceIcon, deviceType, deviceColor, deviceBadgeColor;
        
        if (isUsb) {
          // Check for specific device types
          if (port.manufacturer && port.manufacturer.toLowerCase().includes('arduino')) {
            deviceIcon = 'fa-microchip';
            deviceType = 'Arduino Device';
            deviceColor = 'text-success';
            deviceBadgeColor = 'bg-success';
          } else if (port.manufacturer && (port.manufacturer.toLowerCase().includes('ftdi') || 
                                         port.manufacturer.toLowerCase().includes('prolific'))) {
            deviceIcon = 'fa-plug';
            deviceType = 'USB-Serial Adapter';
            deviceColor = 'text-primary';
            deviceBadgeColor = 'bg-primary';
          } else {
            deviceIcon = 'fa-microchip';
            deviceType = 'USB Device';
            deviceColor = 'text-success';
            deviceBadgeColor = 'bg-success';
          }
        } else {
          deviceIcon = 'fa-desktop';
          deviceType = 'System Port';
          deviceColor = 'text-info';
          deviceBadgeColor = 'bg-info';
        }
        
        html += `
          <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100 port-card ${isUsb ? 'usb-device-card' : 'system-port-card'}">
              <div class="card-header d-flex align-items-center justify-content-between py-2 px-3">
                <div class="d-flex align-items-center">
                  <div class="device-icon-container me-2">
                    <i class="fas ${deviceIcon} ${deviceColor}"></i>
                  </div>
                  <span class="badge ${deviceBadgeColor} badge-device-type">${deviceType}</span>
                </div>
                <div class="availability-indicator">
                  <i class="fas fa-circle text-success" title="Available" style="font-size: 0.6rem;"></i>
                </div>
              </div>
              <div class="card-body d-flex flex-column">
                <div class="mb-2">
                  <h6 class="card-title mb-1 fw-bold">${port.path}</h6>
                  <small class="text-muted">Serial Communication Port</small>
                </div>
                <div class="device-details mb-3 flex-grow-1">
                  <div class="detail-item mb-1">
                    <i class="fas fa-industry me-1 text-muted" style="width: 12px;"></i>
                    <small><strong>Manufacturer:</strong> ${port.manufacturer || 'Unknown'}</small>
                  </div>
                  ${port.vendorId ? `
                    <div class="detail-item mb-1">
                      <i class="fas fa-barcode me-1 text-muted" style="width: 12px;"></i>
                      <small><strong>VID:</strong> ${port.vendorId}</small>
                    </div>
                  ` : ''}
                  ${port.productId ? `
                    <div class="detail-item mb-1">
                      <i class="fas fa-hashtag me-1 text-muted" style="width: 12px;"></i>
                      <small><strong>PID:</strong> ${port.productId}</small>
                    </div>
                  ` : ''}
                </div>
                <button class="btn btn-outline-primary w-100" 
                        data-action="click->simple-serial#selectPort" 
                        data-port="${port.path}">
                  <i class="fas fa-arrow-right me-2"></i>Select This Port
                </button>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    if (portsContainer) {
      portsContainer.innerHTML = `<div class="row">${html}</div>`;
    }
  }

  handleConnected(data) {
    this.updateStatus(`Connected to ${data.port}`);
    console.log('Device connected:', data);
  }

  handleData(data) {
    console.log('Received data:', data);
    this.addConsoleMessage(`RX: ${data.trim()}`, 'receive');
  }

  // Console display methods
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
    
    // Find the console output element
    const consoleOutput = this.element.querySelector('.console-output');
    if (consoleOutput) {
      consoleOutput.appendChild(messageElement);
      
      // Auto-scroll to bottom
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    } else {
      console.warn('Console output element not found');
    }
  }

  handleError(error) {
    console.error('WebSocket error:', error);
    this.updateStatus(`Error: ${error}`);
  }

  updateStatus(message) {
    // Update the new compact status indicator
    const compactStatus = document.getElementById('connection-status-compact');
    if (compactStatus) {
      const statusDot = compactStatus.querySelector('.status-dot');
      const statusText = compactStatus.querySelector('.status-text');
      
      if (statusDot && statusText) {
        statusText.textContent = message;
        
        // Update dot color and animation based on status
        statusDot.className = 'status-dot me-2';
        if (message.toLowerCase().includes('connected')) {
          statusDot.classList.add('bg-success');
        } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
          statusDot.classList.add('bg-danger');
        } else if (message.toLowerCase().includes('connecting') || message.toLowerCase().includes('trying')) {
          statusDot.classList.add('bg-warning');
        } else {
          statusDot.classList.add('bg-secondary');
        }
      }
    }
    
    // Also update the old status div for any legacy references
    const statusDiv = document.getElementById('connection-status');
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = message.includes('Connected') ? 'alert alert-success d-none' : 
                           message.includes('Error') ? 'alert alert-danger d-none' : 'alert alert-info d-none';
    }
  }

  // Method to be called by refresh button
  refreshPorts() {
    console.log('Refreshing ports...');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.listPorts();
    } else {
      this.updateStatus('WebSocket not connected. Trying to reconnect...');
      this.initWebSocket();
    }
  }

  // Handle port selection
  selectPort(event) {
    const portPath = event.currentTarget.dataset.port;
    console.log('Selected port:', portPath);
    
    // Show the add device form and pre-fill the port
    const addDeviceForm = document.getElementById('new-device-form');
    const portSelect = document.getElementById('device-port');
    
    if (addDeviceForm && portSelect) {
      // Remove d-none class to show the form
      addDeviceForm.classList.remove('d-none');
      
      // Clear existing options and add the selected port
      portSelect.innerHTML = `<option value="${portPath}" selected>${portPath}</option>`;
      
      // Scroll to the form
      addDeviceForm.scrollIntoView({ behavior: 'smooth' });
      
      this.updateStatus(`Selected port: ${portPath}. Fill out the form below to add this device.`);
    }
  }

  // Form handling methods
  async saveDevice(event) {
    event.preventDefault(); // Prevent page reload
    console.log('Saving device...');
    
    const formData = new FormData(this.deviceFormElement);
    const deviceData = Object.fromEntries(formData.entries());
    
    console.log('Device data:', deviceData);
    
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
        const savedDevice = await response.json();
        console.log('Device saved successfully:', savedDevice);
        
        this.updateStatus(`Device '${deviceData.name}' saved successfully!`);
        this.cancelAddDevice(); // Hide the form
        this.loadDevices(); // Refresh the device list
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        this.updateStatus('Failed to save device: ' + Object.values(errorData).flat().join(', '));
      }
    } catch (error) {
      console.error('Error saving device:', error);
      this.updateStatus('Error saving device: ' + error.message);
    }
  }

  cancelAddDevice() {
    const addDeviceForm = document.getElementById('new-device-form');
    if (addDeviceForm) {
      addDeviceForm.classList.add('d-none');
      if (this.deviceFormElement) {
        this.deviceFormElement.reset();
      }
    }
    this.updateStatus('Device form cancelled');
  }

  getCsrfToken() {
    const tokenElement = document.querySelector('meta[name="csrf-token"]');
    return tokenElement ? tokenElement.getAttribute('content') : '';
  }

  // Device action methods
  async connectToDevice(event) {
    const deviceId = event.currentTarget.dataset.deviceId;
    console.log('Connecting to device:', deviceId);
    
    try {
      // First, update the device status in Rails
      const response = await fetch(`/devices/${deviceId}/connect`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.getCsrfToken()
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Device connection response:', data);
        
        // Connect via WebSocket with the device settings
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'connect',
            port: data.connection_settings.port,
            options: {
              baudRate: data.connection_settings.baud_rate,
              dataBits: data.connection_settings.data_bits,
              stopBits: data.connection_settings.stop_bits,
              parity: data.connection_settings.parity
            }
          }));
          
          this.updateStatus(`Connecting to ${data.connection_settings.port}...`);
        } else {
          this.updateStatus('WebSocket not connected. Cannot connect to device.');
        }
        
        // Refresh device list to show updated status
        this.loadDevices();
      } else {
        const errorData = await response.json();
        console.error('Connection failed:', errorData);
        this.updateStatus('Failed to connect: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      this.updateStatus('Error connecting to device: ' + error.message);
    }
  }

  async deleteDevice(event) {
    const deviceId = event.currentTarget.dataset.deviceId;
    
    if (confirm('Are you sure you want to delete this device?')) {
      console.log('Deleting device:', deviceId);
      
      try {
        const response = await fetch(`/devices/${deviceId}`, {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': this.getCsrfToken()
          }
        });

        if (response.ok) {
          this.updateStatus('Device deleted successfully');
          this.loadDevices(); // Refresh the device list
        } else {
          const errorData = await response.json();
          this.updateStatus('Failed to delete device: ' + errorData.error);
        }
      } catch (error) {
        console.error('Error deleting device:', error);
        this.updateStatus('Error deleting device: ' + error.message);
      }
    }
  }

  // Test button handler
  testButton() {
    console.log('Test button clicked - JavaScript is working!');
    this.updateStatus('Test button clicked - JavaScript is working!');
  }
}