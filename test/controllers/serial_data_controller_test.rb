require "test_helper"

class SerialDataControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get serial_data_index_url
    assert_response :success
  end

  test "should get create" do
    get serial_data_create_url
    assert_response :success
  end
end
