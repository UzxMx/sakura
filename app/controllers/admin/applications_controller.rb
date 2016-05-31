class Admin::ApplicationsController < ApplicationController
  layout 'admin'
  before_action :authenticate_admin!

  def index
    applications = Application.all

    @applications = applications
  end

  def new
    @application = Application.new
  end

  def create
    application = params[:application]
    application = Application.new({
      app_id: Application.create_application_id,
      name: application['name'],
      app_type: application['app_type'].to_i
    })
    application.save!

    redirect_to action: 'index'
  end
end
