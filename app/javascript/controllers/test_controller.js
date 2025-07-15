import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    console.log('Test controller connected - Stimulus is working!');
    this.element.innerHTML = '<div class="alert alert-success">✅ Stimulus Test Controller is Working!</div>';
  }
}