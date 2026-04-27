# frozen_string_literal: true

FactoryBot.define do
  factory :deckbuilding_restriction do
    sequence(:id) { |n| "restriction-#{n}" } # rubocop:disable FactoryBot/IdSequence
    sequence(:name) { |n| "Deckbuilding Restriction #{n}" }
    date_start { Time.zone.today - 60.days }
    play_format_id { 'standard' }
  end
end
