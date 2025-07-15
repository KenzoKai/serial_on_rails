class ProfilesController < ApplicationController
  before_action :set_device

  def show
    @profile = @device.profiles.find(params[:id])
  end

  def new
    @profile = @device.profiles.build
  end

  def create
    @profile = @device.profiles.build(profile_params)
    if @profile.save
      redirect_to @device, notice: 'Profile was successfully created.'
    else
      render :new
    end
  end

  private

  def set_device
    @device = Device.find(params[:device_id])
  end

  def profile_params
    params.require(:profile).permit(:name, :configurations)
  end
end
