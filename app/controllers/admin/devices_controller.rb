MAX_COUNT_PER_PAGE = 15

class Admin::DevicesController < ApplicationController
  layout 'admin'
  before_action :authenticate_admin!

  def index
    logger.debug params

    if params[:page].nil?
      current_page = 1
    else
      current_page = params[:page].to_i
    end

    online = nil
    unless params[:online].nil?
      online = params[:online] != 'false'
    end

    where_conds = {}
    application_id = params[:application_id].to_i
    where_conds['application_id'] = application_id

    unless online.nil?
      where_conds['online'] = online
    end

    query = Device
    if where_conds.size != 0
      query = query.where(where_conds)
    end
    devices = query.offset((current_page - 1) * MAX_COUNT_PER_PAGE).limit(MAX_COUNT_PER_PAGE)

    devices_total_count = 0
    if where_conds.size != 0
      devices_total_count = Device.where(where_conds).count
    else
      devices_total_count = Device.count
    end

    @devices = devices
    @online = online

    @devices_total_count = devices_total_count

    @application = Application.find(application_id)

    page_num = @devices_total_count / MAX_COUNT_PER_PAGE
    page_num += 1 if @devices_total_count % MAX_COUNT_PER_PAGE

    page_start, page_end = pagination(page_num, current_page, 8)

    @page_start = page_start
    @page_end = page_end
    @page_num = page_num
    @current_page = current_page
  end

  def show
    device = Device.find(params[:device_id].to_i)

    logs = get_logs

    @device = device
    @logs = logs
  end

  def get_info
    # TODO check if online
    send_command(params[:device_id], type: 'get_device_info')

    render json: {
      status: 1
    }
  end

  def fetch_logs
    send_command(params[:device_id], type: 'fetch_device_logs')

    render json: {
      status: 1
    }
  end

  def download_log
    logs_dir = File.join(Rails.application.device_logs_dir, "#{params[:device_id]}")

    path = File.join(logs_dir, "#{params[:file]}.#{params[:format]}")
    send_file(path)
  end

  def configure_logger
    log_level = params[:log_level].to_i
    log_sent_freq = params[:log_sent_freq].to_i
    send_command(params[:device_id], type: 'configure_logger', content: { log_level: log_level, log_sent_freq: log_sent_freq})

    render json: {
      status: 1
    }
  end

  def logs
    logs = get_logs

    render json: {
      status: 1,
      content: {
        logs: logs
      }
    }
  end

  private
    def pagination(page_num, current_page, showed_num)
      page_start = 1

      half = showed_num / 2
      if current_page > half
        page_start = current_page - half + 1
      end

      page_end = page_start + showed_num - 1
      if page_end > page_num
        page_end = page_num
      end

      [page_start, page_end]
    end

    def send_command(device_id, command = {})
      ActionCable.server.broadcast("from_captain:devices:#{device_id}", command)
    end

    def get_logs
      logs_dir = File.join(Rails.application.device_logs_dir, "#{params[:device_id]}")
      files = []
      begin
        Dir.foreach(logs_dir) do |file|
          next if file == '.' or file == '..'
          files << file
        end
      rescue Exception => e
      end

      files.sort do |x, y|
        y <=> x
      end

      logs = []
      files.each do |file|
        filename = file
        file = File.join(logs_dir, file)
        size = File.size(file)
        if size < 1024
          size = "#{size} B"
        elsif size < 1024 * 1024
          size = "%0.1f KB" % [size / 1024.0]
        else
          size = "%0.1f MB" % [size / 1024.0 / 1024.0]
        end

        time_format = '%Y-%m-%d %H:%M:%S'
        mtime = File.mtime(file).strftime(time_format)
            
        log = {
          name: filename,
          size: size,
          mtime: mtime
        }
        logs << log
      end
      logs
    end
end
