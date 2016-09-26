Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root 'home#index'

  devise_for :admins, controllers: {
    sessions: 'admin/sessions'
  }

  get 'admin' => 'admin#index'
  namespace :admin do
    resources :applications

    get 'applications/:application_id/devices' => 'devices#index', as: :application_devices

    get 'devices/:device_id' => 'devices#show', as: :device

    post 'devices/:device_id/get_info' => 'devices#get_info', as: :device_get_info

    post 'devices/:device_id/fetch_logs' => 'devices#fetch_logs', as: :device_fetch_logs

    get 'devices/:device_id/logs' => 'devices#logs', as: :device_logs

    get 'devices/:device_id/download/:file' => 'devices#download_log', as: :device_download_log

    post 'devices/:device_id/configure_logger' => 'devices#configure_logger', as: :device_configure_logger

    get 'devices/:device_id/status_stats' => 'devices#status_stats', as: :device_status_stats
  end
end
