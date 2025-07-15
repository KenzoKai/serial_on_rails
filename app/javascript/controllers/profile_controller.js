import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="profile"
export default class extends Controller {
  static targets = [ "value" ]

  connect() {
    this.element.addEventListener('serial:data', this.handleData.bind(this));
    this.serialController = this.application.getControllerForElementAndIdentifier(this.element, "serial");
  }

  handleData(event) {
    const data = event.detail.data;
    // Assuming data format is "id:value"
    const parts = data.split(':');
    if (parts.length === 2) {
      const id = parts[0];
      const value = parts[1];

      const target = this.valueTargets.find(t => t.dataset.id === id);
      if (target) {
        target.textContent = value;
      }
    }
  }

  send_command(event) {
    const command = event.currentTarget.dataset.command;
    if (this.serialController && this.serialController.port) {
      console.log(`Sending command: ${command}`);
      this.serialController.write(command);
    } else {
      console.error("Serial port not connected.");
      alert("Device not connected. Please connect to a serial device first.");
    }
  }
}
