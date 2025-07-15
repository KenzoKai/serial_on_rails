const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8081 });

// Keep track of connected serial ports
let serialPort = null;

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send list of available ports when client connects
  listPorts().then(ports => {
    ws.send(JSON.stringify({
      type: 'ports',
      ports: ports
    }));
  });

  // Handle incoming messages from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      
      if (data.type === 'connect') {
        // Connect to serial port
        if (serialPort) {
          serialPort.close();
          serialPort = null;
        }
        
        try {
          serialPort = new SerialPort({
            path: data.port,
            baudRate: data.options?.baudRate || 9600,
            dataBits: data.options?.dataBits || 8,
            stopBits: data.options?.stopBits || 1,
            parity: data.options?.parity || 'none',
            autoOpen: false
          });

          // Handle port open
          serialPort.open((err) => {
            if (err) {
              throw new Error(`Failed to open port: ${err.message}`);
            }
            
            // Add parser
            const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

            // Handle data from serial port
            parser.on('data', (data) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'data',
                  data: data,
                  timestamp: new Date().toISOString()
                }));
              }
            });

            // Send success message
            ws.send(JSON.stringify({
              type: 'connected',
              port: data.port
            }));
          });

          // Handle port errors
          serialPort.on('error', (error) => {
            console.error('Serial port error:', error);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                error: error.message
              }));
            }
          });

          // Handle port close
          serialPort.on('close', () => {
            console.log('Serial port closed');
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'disconnected'
              }));
            }
          });

        } catch (error) {
          console.error('Error creating serial port:', error);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message
            }));
          }
        }
      }
      
      if (data.type === 'write' && serialPort && serialPort.isOpen) {
        // Write to serial port
        serialPort.write(data.data, (err) => {
          if (err && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'error',
              error: `Write error: ${err.message}`
            }));
          }
        });
      }
      
      if (data.type === 'disconnect' && serialPort) {
        // Disconnect from serial port
        serialPort.close((err) => {
          if (err) {
            console.error('Error closing port:', err);
          }
          serialPort = null;
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'disconnected'
            }));
          }
        });
      }
      
      if (data.type === 'list_ports') {
        // Send list of available ports
        listPorts().then(ports => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ports',
              ports: ports
            }));
          }
        });
      }
      
    } catch (error) {
      console.error('Error handling message:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          error: `Server error: ${error.message}`
        }));
      }
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    if (serialPort) {
      serialPort.close();
      serialPort = null;
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// List available serial ports
async function listPorts() {
  try {
    console.log('Attempting to list serial ports...');
    const ports = await SerialPort.list();
    console.log('Available ports:', JSON.stringify(ports, null, 2));
    
    if (ports.length === 0) {
      console.warn('No serial ports found. Make sure your device is connected and recognized by the system.');
    } else {
      console.log('Ports found:');
      ports.forEach((port, index) => {
        console.log(`[${index + 1}] ${port.path} - ${port.manufacturer || 'Unknown manufacturer'}`);
      });
    }
    
    return ports;
  } catch (error) {
    console.error('Error listing ports:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return [];
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (serialPort) {
    serialPort.close();
  }
  wss.close(() => {
    process.exit(0);
  });
});

console.log('WebSocket server started on port 8081');
