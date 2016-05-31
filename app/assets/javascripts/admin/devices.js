var dateFormat = require('dateformat');

(function ($) {
  var Sakura = window.Sakura || {};
  window.Sakura = Sakura;

  var Admin = Sakura.Admin || {};
  Sakura.Admin = Admin;

  var Device = Admin.Device || {};
  Admin.Devices = Device;

  Device.init = function() {

    var get_filter_params = function() {
      var params = {};
      var online = $('select[name=online]').val();
      if (online != -1) {
        params['online'] = online;
      }

      return params;
    };

    $('.btn-filter-devices').click(function() {
      var application_id = $('#applicationId').attr('data-application-id');
      location.href = Routes.admin_application_devices_path(application_id, get_filter_params());
    });

    $('.container-pagination a').click(function(event) {
      var page = $(this).attr('data-page');
      if (page) {
        var params = get_filter_params();
        params['page'] = page;
        var application_id = $('#applicationId').attr('data-application-id');
        location.href = Routes.admin_application_devices_path(application_id, params);
      }

      event.preventDefault();
    });

    function ActionList() {
      this.list = []
    }

    ActionList.prototype.has = function(action) {
      return this.list.indexOf(action) != -1;
    };
    ActionList.prototype.add = function(action) {
      this.list.push(action);
    };
    ActionList.prototype.remove = function(action) {
      var idx = this.list.indexOf(action);
      if (idx != -1) {
        this.list.splice(idx, 1);
      }
    };

    var action_list = new ActionList();

    function DeviceAction(options) {
      this.options = $.extend({
        name: '',
        timeout_s: 50,
        timeout_msg: '操作超时',
        success_msg: '',
        btn_css_selector: '',
      }, options);

      this.$button = $(options.btn_css_selector);
      this.$button.click($.proxy(this.on_button_click, this));
      this.device_id = $('#deviceId').attr('data-device-id');
    }

    DeviceAction.prototype.on_button_click = function() {
      if (this.perform_action()) {
        action_list.add(this.options.name);
        this.disable_button();
        this.start_timer();
      }
    };

    DeviceAction.prototype.perform_action = function() {
    };

    DeviceAction.prototype.disable_button = function() {
      this.$button.prop("disabled", true).addClass('processing');
    };

    DeviceAction.prototype.enable_button = function() {
      this.$button.prop("disabled", false).removeClass('processing');
    };

    DeviceAction.prototype.start_timer = function() {
      this.timeout_handle = setTimeout(this.on_timeout, this.options.timeout_s * 1000);
    };

    DeviceAction.prototype.stop_timer = function() {
      clearTimeout(this.timeout_handle);
    };

    DeviceAction.prototype.on_timeout = function() {
      action_list.remove(this.options.name);
      this.restore_to_normal();
      toastr.error(this.options.timeout_msg);
    };

    DeviceAction.prototype.on_error = function() {
      action_list.remove(this.options.name);
      this.stop_timer();
      this.restore_to_normal();
      toastr.error('操作失败');
    };

    DeviceAction.prototype.restore_to_normal = function() {
      this.enable_button();
    };

    DeviceAction.prototype.notification_arrived = function(data) {
      if (action_list.has(this.options.name)) {
        action_list.remove(this.options.name);
        this.stop_timer();
        this.restore_to_normal();
        toastr.success(this.options.success_msg);
      }

      this.on_notification(data);
    };

    // need to be overridden
    DeviceAction.prototype.on_notification = function(data) {
    };

    var get_device_info_action = (function() {
      var GetDeviceInfoAction = function() {
      };

      GetDeviceInfoAction.prototype = new DeviceAction({
        name: 'get_device_info',
        timeout_msg: '获取设备信息超时，请稍候尝试。',
        success_msg: '获取设备信息成功。',
        btn_css_selector: '.btn-fetch-new-info',
      });

      GetDeviceInfoAction.prototype.perform_action = function() {
        var device_id = this.device_id;
        $.post({
          url: Routes.admin_device_get_info_path(device_id),
          success: function(data) {
            // TODO we may need to handle error here
            if (data.status == 1) {
            } else {
            }
          }
        });
        return true;
      };

      GetDeviceInfoAction.prototype.on_notification = function(data) {
        var device_info = data.device_info;
        if (device_info != null) {
          $('#deviceLocale').text(device_info['locale']);
          $('#deviceOS').text(device_info['os']);
          $('#deviceManufacturer').text(device_info['manufacturer']);
          $('#deviceAppVersion').text(device_info['app_version']);
          var network_type = device_info['network_type'];
          var network;
          switch (network_type) {
            case 1:
              network = "Wi-Fi";
              break;
            case 2:
              network = "Mobile";
              break;
            case 3:
              network = "Wimax";
              break;
            case 4:
              network = "Ethernet";
              break;
            case 5:
              network = "Bluetooth";
              break;
            default:
              network = "Unknown";
              break;
          }
          $('#deviceNetwork').text(network);
          var battery_info = $.parseJSON(device_info['battery_info']);
          var battery_remaining = battery_info['percent'] + "%";
          var battery_source = '';
          switch (battery_info['power_source_type']) {
            case 1:
              battery_source = "Not Charging";
              break;
            case 2:
              battery_source = "AC";
              break;
            case 3:
              battery_source = "USB";
              break;
            case 4:
              battery_source = "Wireless";
              break;
            default:
              battery_source = "Unknown";
              break;
          }

          var battery_consume_rate = '';
          if (battery_info['amount_consumed'] != null) {
            battery_consume_rate = battery_info['amount_consumed'] + " / " + battery_info['duration'] + " min";
          } else {
            battery_consume_rate = 'Not Got';
          }

          $('#deviceBatteryInfo').text('Remaining ' + battery_remaining + ", Power Source " + battery_source + ", Consume Rate " + battery_consume_rate);
        }

        var user_info = data.user_info;
        if (user_info != null && user_info.username != null && user_info.username != '') {
          $('#deviceUsername').text(user_info.username);
        }

        var updated_at = new Date(Date.parse(data.updated_at));
        var date_str = dateFormat(updated_at, "yyyy-mm-dd HH:MM:ss");
        $('#deviceUpdatedTime').text(date_str);
      };

      return new GetDeviceInfoAction();
    })();

    var configure_logger_action = (function() {
      function ConfigureLoggerAction() {
      }
      ConfigureLoggerAction.prototype = new DeviceAction({
        name: 'configure_logger',
        timeout_msg: '修改日志设置超时，请稍候尝试。',
        success_msg: '修改日志设置成功。',
        btn_css_selector: '.btn-configure-logger',        
      });      

      ConfigureLoggerAction.prototype.perform_action = function() {
        var device_id = this.device_id;
        var log_level = $('input[name=log_level]').val();
        var log_sent_freq = $('input[name=log_sent_freq').val();
        $.post({
          url: Routes.admin_device_configure_logger_path(device_id),
          data: {
            log_level: log_level,
            log_sent_freq: log_sent_freq
          },
          success: function(data) {
            // TODO
            if (data.status == 1) {
            }
          }
        });   
        return true;
      };

      ConfigureLoggerAction.prototype.on_notification = function(data) {   
        get_device_info_action.on_notification(data);
      };

      return new ConfigureLoggerAction();
    })();

    var fetch_device_logs_action = (function() {
      function FetchDeviceLogsAction() {
      }
      FetchDeviceLogsAction.prototype = new DeviceAction({
        name: 'fetch_device_logs',
        timeout_msg: '获取日志超时，请稍候尝试。',
        success_msg: '获取日志成功。',
        btn_css_selector: '.btn-fetch-logs',        
      });      

      FetchDeviceLogsAction.prototype.perform_action = function() {
        var device_id = this.device_id;
        $.post({
          url: Routes.admin_device_fetch_logs_path(device_id),
          success: function(data) {
            if (data.status == 1) {
              // TODO
            }
          }
        }); 
        return true;
      };

      FetchDeviceLogsAction.prototype.notification_arrived = function(data) {   
        var device_id = this.device_id;
        var that = this;
        $.get({
          url: Routes.admin_device_logs_path(device_id),
          success: function(data) {
            if (action_list.has(that.options.name)) {
              action_list.remove(that.options.name);
              that.stop_timer();
              that.restore_to_normal();
            }            

            if (data.status == 1) {
              toastr.success(that.options.success_msg);

              var logs = data.content.logs;
              if (logs.length > 0) {
                var html = '';
                for (var i in logs) {
                  var log = logs[i];
                  html += '<div class="row">';
                  html += '<div class="col-sm-2">' + log.name + '</div>';
                  html += '<div class="col-sm-8">';
                  html += '<span>modified at ' + log.mtime + '</span>';
                  html += '<span>, size ' + log.size + '</span>';
                  html += '</div>';
                  html += '<div class="col-sm-2">'
                  html += '<a href="' + Routes.admin_device_download_log_path(device_id, log.name) + '">Download</a>';
                  html += '</div>';
                  html += '</div>';
                }
                $('#deviceLogs').empty().append($(html));
              }
            }
          }
        })
      };

      return new FetchDeviceLogsAction();
    })();    

    var create_channel = function() {
      var deviceId = $('#deviceId').attr('data-device-id');

      var monitor = App.cable.subscriptions.create("MonitorChannel", {
        connected: function() {
          console.log('connected');

          this.perform('monitor_device', {
            device_id: deviceId
          });
        },
        disconnected: function() {
          console.log('disconnected');
        },
        received: function(data) {
          console.log('received: %o', data);

          var type = data.type;
          if (type == 'appearance') {
            handle_apperance(data);
          } else if (type == 'disappearance') {
            handle_disappearance(data);
          } else if (type == 'get_device_info') {
            get_device_info_action.notification_arrived(data);
          } else if (type == 'fetch_device_logs') {
            fetch_device_logs_action.notification_arrived(data);
          } else if (type == 'configure_logger') {
            configure_logger_action.notification_arrived(data);
          } else {
            console.log("unknown type: " + type);
          }
        }
      });

      function handle_apperance(data) {
        var device_id = parseInt($('#deviceId').attr('data-device-id'));
        if (device_id == data.device_id) {
          toastr.info('用户已上线');
          $('#deviceOnlineStatus').text('在线');
        }
      }

      function handle_disappearance(data) {
        var device_id = parseInt($('#deviceId').attr('data-device-id'));
        if (device_id == data.device_id) {
          toastr.info('用户已下线');
          $('#deviceOnlineStatus').text('离线');
        }
      }      
    };

    create_channel();
  };

  $(function() {
    Device.init();
  });
})(jQuery);