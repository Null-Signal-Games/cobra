# frozen_string_literal: true

FactoryBot.define do
  factory :pairing do
    round
    player1 factory: %i[player]
    player2 factory: %i[player]
    score1 { 0 }
    score2 { 0 }
    side { nil }
  end
end
