class CreateDevices < ActiveRecord::Migration[8.0]
  def change
    create_table :devices do |t|
      t.string :name
      t.string :port
      t.string :firmware_version
      t.string :status

      t.timestamps
    end
  end
end
