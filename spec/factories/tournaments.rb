# frozen_string_literal: true

FactoryBot.define do
  factory :tournament do
    name { 'Tournament Name' }
    user

    transient do
      player_count { 0 }
    end

    after(:create) do |tournament, evaluator|
      create_list(:player, evaluator.player_count, tournament:)
    end

    # First stage is single-sided swiss instead of double-sided.
    trait :single_sided do
      swiss_format { :single_sided }
    end

    # Self-registration with NetrunnerDB deck registration turned on.
    trait :nrdb_registration do
      self_registration { true }
      nrdb_deck_registration { true }
    end

    # Players plus a paired first round in the current (swiss) stage.
    trait :with_paired_round do
      player_count { 4 }

      after(:create) do |tournament|
        tournament.current_stage.pair_new_round!
      end
    end

    # A completed swiss round followed by an elimination stage seeded from the standings.
    trait :double_elim_cut do
      transient do
        cut_size { 4 }
      end

      player_count { 8 }

      after(:create) do |tournament, evaluator|
        tournament.current_stage.pair_new_round!.update!(completed: true)
        tournament.cut_to!(:double_elim, evaluator.cut_size)
      end
    end
  end

  factory :sss_tournament, class: 'Tournament' do
    name { 'SSS Tournament' }
    user

    transient do
      player_count { 0 }
    end

    after(:create) do |tournament, evaluator|
      create_list(:player, evaluator.player_count, tournament:)
    end
  end
end
