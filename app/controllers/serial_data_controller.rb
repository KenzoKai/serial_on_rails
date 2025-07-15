class SerialDataController < ApplicationController
  before_action :set_device, only: [:index, :create]

  # GET /devices/:device_id/serial_data
  def index
    @serial_data = @device.serial_data.recent.limit(100)
    respond_to do |format|
      format.html
      format.json { render json: @serial_data }
    end
  end

  # POST /devices/:device_id/serial_data
  def create
    @serial_datum = @device.serial_data.build(serial_data_params)
    
    if @serial_datum.save
      render json: @serial_datum, status: :created
    else
      render json: @serial_datum.errors, status: :unprocessable_entity
    end
  end

  private

  def set_device
    @device = Device.find(params[:device_id])
  end

  def serial_data_params
    params.require(:serial_datum).permit(:data, :direction)
  end
end
