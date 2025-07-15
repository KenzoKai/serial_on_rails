require "test_helper"

class DevicesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get devices_index_url
    assert_response :success
  end

  test "should get create" do
    get devices_create_url
    assert_response :success
  end

  test "should get show" do
    get devices_show_url
    assert_response :success
  end
end
