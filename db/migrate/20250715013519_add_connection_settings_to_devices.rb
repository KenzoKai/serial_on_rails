class AddConnectionSettingsToDevices < ActiveRecord::Migration[8.0]
  def change
    add_column :devices, :baud_rate, :integer
    add_column :devices, :data_bits, :integer
    add_column :devices, :stop_bits, :integer
    add_column :devices, :parity, :string
  end
end
