#!/usr/bin/env ruby
require_relative 'config/environment'

# Create a test device
device = Device.create!(
  name: 'Test Device',
  port: 'COM1',
  status: 'disconnected',
  baud_rate: 9600,
  data_bits: 8,
  stop_bits: 1,
  parity: 'none'
)

puts "Created device: #{device.inspect}"