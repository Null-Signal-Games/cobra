# frozen_string_literal: true

FactoryBot.define do
  factory :pairing do
    round
    player1 factory: %i[player]
    player2 factory: %i[player]
    score1 { nil }
    score2 { nil }
    side { nil }

    # Scores are nil until reported. Use this when a spec needs the pairing to count as reported
    # (e.g. Pairing.reported) without caring about the result.
    trait :reported do
      score1 { 0 }
      score2 { 0 }
    end
  end
end
