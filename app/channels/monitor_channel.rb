# Be sure to restart your server when you modify this file. Action Cable runs in a loop that does not support auto reloading.
class MonitorChannel < ApplicationCable::Channel
  def subscribed
    logger.debug "subscribed"

    stream_from "from_devices:devices"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.debug "unsubscribed"
    stop_all_streams
  end

  def monitor_device(data)
    stream_from "from_devices:devices:#{data['device_id']}"
  end
end
