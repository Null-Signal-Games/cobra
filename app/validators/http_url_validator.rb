# frozen_string_literal: true

# Validates that a given string is a valid http or https url with a scheme and host present.
class HttpUrlValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    uri = URI.parse(value)
    return if %w[http https].include?(uri.scheme) && uri.host.present?

    record.errors.add(attribute, options[:message] || 'must be a full URL starting with http:// or https://')
  rescue URI::InvalidURIError
    record.errors.add(attribute, options[:message] || 'is not a valid URL')
  end
end
