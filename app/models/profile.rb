class Profile < ApplicationRecord
  belongs_to :device
  
  validates :name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :configurations, presence: true
  
  before_validation :set_default_configurations, on: :create
  
  def baud_rate
    configurations['baud_rate'] || 9600
  end
  
  def data_bits
    configurations['data_bits'] || 8
  end
  
  def stop_bits
    configurations['stop_bits'] || 1
  end
  
  def parity
    configurations['parity'] || 'none'
  end
  
  def connection_settings
    {
      baud_rate: baud_rate,
      data_bits: data_bits,
      stop_bits: stop_bits,
      parity: parity
    }
  end
  
  def apply_to_device!
    device.update!(
      baud_rate: baud_rate,
      data_bits: data_bits,
      stop_bits: stop_bits,
      parity: parity
    )
  end
  
  private
  
  def set_default_configurations
    self.configurations ||= {
      'baud_rate' => 9600,
      'data_bits' => 8,
      'stop_bits' => 1,
      'parity' => 'none'
    }
  end
end
