require 'test_helper'

class Admin::DevicesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get admin_devices_index_url
    assert_response :success
  end

end
