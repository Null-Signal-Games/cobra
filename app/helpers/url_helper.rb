# frozen_string_literal: true

module UrlHelper # rubocop:disable Style/Documentation
  def qr_code_svg(slug)
    qr_code(slug)&.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 25)
  end

  def qr_code(slug)
    return unless slug

    @qr_code ||= RQRCode::QRCode.new(
      tournament_shortlink_url(slug: slug.downcase),
      level: :h
    )
  end
end
