class Application < ApplicationRecord
  enum app_type: [:android, :ios]

  class << self
    def create_application_id
      SecureRandom.uuid
    end
  end
end
