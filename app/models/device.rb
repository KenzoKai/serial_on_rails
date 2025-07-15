class Device < ApplicationRecord
  has_many :profiles, dependent: :destroy
  has_many :serial_data, dependent: :destroy

  validates :name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :port, presence: true, format: { with: /\A(COM\d+|\/dev\/tty[\w\d]+)\z/, message: "must be a valid serial port (e.g., COM1, /dev/ttyUSB0)" }
  validates :status, inclusion: { in: %w[connected disconnected error] }

  before_validation :set_default_status, on: :create

  scope :connected, -> { where(status: 'connected') }
  scope :available, -> { where(status: ['disconnected', 'error']) }

  def connected?
    status == 'connected'
  end

  def can_connect?
    # Allow connection from any status for now (testing)
    true
  end

  def connection_settings
    {
      port: port,
      baud_rate: baud_rate || 9600,
      data_bits: data_bits || 8,
      stop_bits: stop_bits || 1,
      parity: parity || 'none'
    }
  end

  private

  def set_default_status
    self.status ||= 'disconnected'
  end
end
