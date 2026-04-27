# frozen_string_literal: true

FactoryBot.define do
  factory :card_set do
    sequence(:id) { |n| "card-set-#{n}" } # rubocop:disable FactoryBot/IdSequence
    sequence(:name) { |n| "Card Set #{n}" }
    date_release { Time.zone.today - 30.days }
  end
end
