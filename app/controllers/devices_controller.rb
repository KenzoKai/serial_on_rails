class DevicesController < ApplicationController
  before_action :set_device, only: [:show, :update, :destroy, :connect, :disconnect]

  # GET /devices
  def index
    @devices = Device.all
    respond_to do |format|
      format.html
      format.json { render json: @devices }
    end
  end

  # GET /devices/1
  def show
    respond_to do |format|
      format.html
      format.json { render json: @device.as_json(include: :profiles) }
    end
  end

  # POST /devices
  def create
    @device = Device.new(device_params)

    if @device.save
      render json: @device, status: :created, location: @device
    else
      render json: @device.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /devices/1
  def update
    if @device.update(device_params)
      render json: @device
    else
      render json: @device.errors, status: :unprocessable_entity
    end
  end

  # DELETE /devices/1
  def destroy
    @device.destroy
    head :no_content
  end

  # POST /devices/1/connect
  def connect
    Rails.logger.info "Attempting to connect device #{@device.id} with status: #{@device.status}"
    Rails.logger.info "can_connect? returns: #{@device.can_connect?}"
    
    if @device.can_connect?
      @device.update(status: 'connected')
      render json: { 
        message: 'Device connected successfully', 
        device: @device,
        connection_settings: @device.connection_settings
      }
    else
      render json: { 
        error: "Device cannot be connected. Current status: #{@device.status}. Device can only connect when not already connected." 
      }, status: :unprocessable_entity
    end
  end

  # POST /devices/1/disconnect
  def disconnect
    if @device.connected?
      @device.update(status: 'disconnected')
      render json: { message: 'Device disconnected successfully', device: @device }
    else
      render json: { error: 'Device is not connected' }, status: :unprocessable_entity
    end
  end

  # GET /devices/available_ports
  def available_ports
    render json: { ports: [] } # This will be populated by the WebSocket server
  end

  private

  def set_device
    @device = Device.find(params[:id])
  end

  def device_params
    params.require(:device).permit(:name, :port, :firmware_version, :status, :baud_rate, :data_bits, :stop_bits, :parity)
  end
end
