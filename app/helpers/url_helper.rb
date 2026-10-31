# frozen_string_literal: true

module UrlHelper # rubocop:disable Style/Documentation
  def qr_code(slug)
    return unless slug

    @qr_code ||= RQRCode::QRCode.new(
      tournament_shortlink_url(slug: slug.downcase),
      level: :h
    )
  end
end
