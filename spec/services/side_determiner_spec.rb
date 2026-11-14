# frozen_string_literal: true

RSpec.describe SideDeterminer do
  let(:swiss_stage) { create(:stage) }
  let(:cut_stage) { create(:stage) }
  let(:decision) { described_class.determine_sides(player1, player2, swiss_stage) }
  let(:player1) { create(:player) }
  let(:player2) { create(:player) }
  let(:player3) { create(:player) }
  let(:player4) { create(:player) }
  let(:swiss_round1) { create(:round, stage: swiss_stage) }
  let(:cut_round1) { create(:round, stage: cut_stage) }

  context 'no games' do
    it 'does not set sides' do
      expect(decision).to be_nil
    end
  end

  context 'side bias' do
    before do
      # Stage 1, Round 1 side bias:
      #   player1:   1
      #   player2:  -1
      #   player3:   1
      #   player4:  -1
      create(:pairing, player1:, player2:, side: :player1_is_corp, score1: 3, score2: 0,
                       round: swiss_round1)
      create(:pairing, player1: player3, player2: player4, side: :player1_is_corp, score1: 3, score2: 0,
                       round: swiss_round1)

      # Stage 2, Round 1 side bias:
      #   player1:  -1
      #   player2:   1
      #   player3:  -1
      #   player4:   1
      create(:pairing, player1: player4, player2: player1, side: :player1_is_corp, score1: 3, score2: 0,
                       round: cut_round1)
      create(:pairing, player1: player2, player2: player3, side: :player1_is_corp, score1: 3, score2: 0,
                       round: cut_round1)
    end

    it 'is calculated separately for each stage' do
      expect(described_class.differential(player1,
                                          swiss_stage)).not_to eq(described_class.differential(player1, cut_stage))
      expect(described_class.differential(player2,
                                          swiss_stage)).not_to eq(described_class.differential(player2, cut_stage))
      expect(described_class.differential(player3,
                                          swiss_stage)).not_to eq(described_class.differential(player3, cut_stage))
      expect(described_class.differential(player4,
                                          swiss_stage)).not_to eq(described_class.differential(player4, cut_stage))
    end
  end

  context 'difference' do
    before do
      create(:pairing, player1:, side: :player1_is_corp, score1: 3, round: swiss_round1)
      create(:pairing, player1: player2, side: :player1_is_runner, score1: 3, round: swiss_round1)
    end

    it 'determines weaker side' do
      expect(decision).to eq(:player1_is_runner)
    end
  end

  context 'imbalance' do
    before do
      create(:pairing, player1:, side: :player1_is_corp, score1: 3, round: swiss_round1)
      create(:pairing, player1: player2, side: :player1_is_corp, score1: 3, round: swiss_round1)
      create(:pairing, player1: player2, side: :player1_is_corp, score1: 3, round: swiss_round1)
    end

    it 'picks player who has played the overplayed side least' do
      expect(decision).to eq(:player1_is_corp)
    end
  end

  context 'some games played but tied' do
    before do
      create(:pairing, player1:, side: :player1_is_corp, score1: 3, round: swiss_round1)
      create(:pairing, player1: player2, side: :player1_is_corp, score1: 3, round: swiss_round1)
    end

    it 'randomly picks sides' do
      expect(decision).not_to be_nil
    end

    it 'picks the same sides for the same seed' do
      first_run = described_class.determine_sides(player1, player2, swiss_stage, random: Random.new(419))

      expect(described_class.determine_sides(player1, player2, swiss_stage, random: Random.new(419))).to eq(first_run)
    end

    it 'lets the seed decide the sides' do
      expect(described_class.determine_sides(player1, player2, swiss_stage, random: Random.new(1)))
        .to eq(:player1_is_runner)
      expect(described_class.determine_sides(player1, player2, swiss_stage, random: Random.new(2)))
        .to eq(:player1_is_corp)
    end
  end
end
