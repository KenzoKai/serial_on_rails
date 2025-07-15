class CreateSerialData < ActiveRecord::Migration[8.0]
  def change
    create_table :serial_data do |t|
      t.references :device, null: false, foreign_key: true
      t.text :data
      t.string :direction
      t.datetime :timestamp

      t.timestamps
    end
  end
end
