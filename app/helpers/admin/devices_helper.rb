module Admin::DevicesHelper
  def device_online(online)
    if online.nil?
      '状态未知'
    elsif online
      '在线'
    else
      '离线'
    end
  end

  def device_parse_info(info)
    begin
      JSON.parse(info)
    rescue Exception => e
      {}
    end
  end

  def device_network(network)
    unless network.nil?
      case network
      when 1
        "Wi-Fi"
      when 2
        "Mobile" 
      when 3
        "Wimax"
      when 4
        "Ethernet"
      when 5
        "Bluetooth"
      else
        "Unknown"
      end
    end
  end

  def device_battery_info(battery_info)
    battery_remaining = nil
    battery_consume_rate = nil
    battery_source = nil
    if !battery_info.nil? and !battery_info.empty?
      battery_info = JSON.parse(battery_info)
      battery_remaining = "#{battery_info['percent']}%"

      case battery_info['power_source_type']
      when 1
        battery_source = 'Not Charging' 
      when 2
        battery_source = 'AC'
      when 3
        battery_source = 'USB'
      when 4
        battery_source = 'Wireless'
      else
        battery_source = 'Unknown'
      end

      unless battery_info['amount_consumed'].nil?
        battery_consume_rate = "#{battery_info['amount_consumed']} / #{battery_info['duration']} min"
      end
    end

    if battery_remaining.nil?
      battery_remaining = 'Not Got'
    end

    if battery_source.nil?
      battery_source = 'Not Got'
    end

    if battery_consume_rate.nil?
      battery_consume_rate = 'Not Got'
    end

    "Remaining #{battery_remaining}, Power Source #{battery_source}, Consume Rate #{battery_consume_rate}"
  end

  def device_log_level(level)
    if level.nil?
      content_tag(:input, '', type: 'text', name: 'log_level', placeholder: 'Not Got yet')
    else
      content_tag(:input, '', type: 'text', name: 'log_level', value: level)
    end
  end

  def device_log_sent_freq(freq)
    if freq.nil?
      content_tag(:input, '', type: 'text', name: 'log_sent_freq', placeholder: 'Not Got yet')
    else
      content_tag(:input, '', type: 'text', name: 'log_sent_freq', value: freq)
    end
  end
end
