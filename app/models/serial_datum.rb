class SerialDatum < ApplicationRecord
  belongs_to :device
  
  validates :data, presence: true
  validates :direction, inclusion: { in: %w[rx tx] }
  validates :timestamp, presence: true
  
  scope :received, -> { where(direction: 'rx') }
  scope :transmitted, -> { where(direction: 'tx') }
  scope :recent, -> { order(timestamp: :desc) }
  scope :for_device, ->(device_id) { where(device_id: device_id) }
  
  before_validation :set_timestamp, on: :create
  
  def received?
    direction == 'rx'
  end
  
  def transmitted?
    direction == 'tx'
  end
  
  private
  
  def set_timestamp
    self.timestamp ||= Time.current
  end
end
