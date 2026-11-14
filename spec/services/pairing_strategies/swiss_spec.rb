# frozen_string_literal: true

RSpec.describe PairingStrategies::Swiss do
  let(:tournament) { create(:tournament) }
  let(:stage) { tournament.current_stage }
  let(:round) { create(:round, number: 1, stage:, tournament:) }
  let(:pairer) { described_class.new(round, Random.new(1000)) }
  let(:nil_player) { NilPlayer.new }

  before do
    allow(NilPlayer).to receive(:new).and_return(nil_player)
  end

  context 'with four players' do
    %i[jack jill hansel gretel].each do |name|
      let!(name) do
        create(:player, name: name.to_s.humanize, tournament:)
      end
    end

    it 'creates pairings' do
      pairer.pair!

      round.reload

      expect(round.pairings.count).to eq(2)
    end

    context 'with first round byes' do
      before do
        jack.update first_round_bye: true
        jill.update first_round_bye: true
      end

      it 'creates pairings' do
        pairer.pair!

        round.reload

        round.pairings.each do |pairing|
          expect(pairing.players).to contain_exactly(jack, nil_player) if pairing.players.include? jack
          expect(pairing.players).to contain_exactly(jill, nil_player) if pairing.players.include? jill
          expect(pairing.players).to contain_exactly(hansel, gretel) if pairing.players.include? hansel
        end
      end

      it 'gives byes highest table numbers' do
        pairer.pair!

        round.reload

        expect(round.pairings.bye.pluck(:table_number)).to contain_exactly(2, 3)
      end

      context 'when in second round' do
        let(:round2_pairer) { described_class.new(round2) }
        let(:round2) { create(:round, number: 2, stage:, tournament:) }

        before do
          pairer.pair!
        end

        it 'does not create byes' do
          round2_pairer.pair!

          round2.reload

          expect(round2.pairings.count).to eq(2)
          expect(
            round2.pairings.map(&:players).flatten
          ).to contain_exactly(jack, jill, hansel, gretel)
        end
      end
    end

    context 'when after some rounds' do
      let(:round1) { create(:round, number: 1, stage:, tournament:, completed: true) }

      before do
        create(:pairing, player1: jack, player2: jill, score1: 6, score2: 0, round: round1)
        create(:pairing, player1: hansel, player2: gretel, score1: 4, score2: 1, round: round1)
      end

      it 'pairs based on points' do
        round = create(:round, number: 2, stage:, tournament:)

        pairer.pair!

        round.reload

        round.pairings.each do |pairing|
          expect(pairing.players).to contain_exactly(jack, hansel) if pairing.players.include? jack
          expect(pairing.players).to contain_exactly(jill, gretel) if pairing.players.include? jill
        end
      end

      it 'avoids previous matchups' do
        round2 = create(:round, number: 2, stage:, tournament:, completed: true)

        create(:pairing, player1: jack, player2: hansel, score1: 6, score2: 0, round: round2)
        create(:pairing, player1: jill, player2: gretel, score1: 1, score2: 1, round: round2)

        # After round 2, standings are:
        #   jack: 12
        #   hansel: 4
        #   gretel: 2
        #   jill: 1
        # so pairings will be jack vs gretel and hansel vs. jill.

        round3 = create(:round, number: 2, stage:, tournament:)
        pairer.pair!

        round3.reload

        round3.pairings.each do |pairing|
          expect(pairing.players).to contain_exactly(jack, gretel) if pairing.players.include? jack
          expect(pairing.players).to contain_exactly(jill, hansel) if pairing.players.include? jill
        end
      end
    end

    context 'with a player with a fixed table number' do
      before do
        jack.update fixed_table_number: 42
      end

      it 'creates pairings' do
        pairer.pair!

        round.reload

        expect(pairings_table_by_player(round.pairings))
          .to eq jack.name => 42, jill.name => 1, hansel.name => 1, gretel.name => 42
      end

      it 'creates first round bye' do
        jack.update first_round_bye: true
        pairer.pair!

        round.reload

        expect(pairings_table_by_player(round.pairings))
          .to eq hansel.name => 1, gretel.name => 1, jill.name => 2, jack.name => 42
      end
    end
  end

  context 'with three players' do
    %i[snap crackle pop].each do |name|
      let!(name) do
        create(:player, name: name.to_s.humanize, tournament:)
      end
    end

    it 'creates bye' do
      pairer.pair!

      round.reload

      expect(
        round.pairings.map(&:players).flatten
      ).to contain_exactly(snap, crackle, pop, nil_player)
    end

    it 'gives bye highest table number' do
      pairer.pair!

      round.reload

      expect(round.pairings.bye.first.table_number).to eq(round.pairings.count)
    end

    it 'gives win against bye' do
      pairer.pair!

      round.reload.pairings.each do |pairing|
        expect(
          [pairing.score1, pairing.score2]
        ).to match_array(
          pairing.players.include?(nil_player) ? [0, 6] : [nil, nil]
        )
      end
    end

    context 'when after multiple rounds' do
      let(:round1) { create(:round, number: 1, stage:, tournament:, completed: true) }
      let(:round) { create(:round, number: 2, stage:, tournament:) }
      let(:pairer) { described_class.new(round, Random.new(1000)) }

      before do
        create(:pairing, player1: snap, score1: 6, player2: crackle, score2: 3, round: round1)
        create(:pairing, player1: pop, player2: nil, score1: 1, score2: 0, round: round1)
      end

      it 'avoids previous byes' do
        pairer.pair!

        round.reload

        round.pairings.each do |pairing|
          expect(pairing.players).not_to contain_exactly(pop, nil_player) if pairing.players.include? pop
        end
      end

      it 'gives bye highest table number' do
        pairer.pair!

        round.reload

        expect(round.pairings.bye.first.table_number).to eq(round.pairings.count)
      end
    end

    context 'with drop' do
      before do
        pop.update active: false
      end

      it 'excludes dropped players' do
        pairer.pair!

        round.reload

        expect(
          round.pairings.map(&:players).flatten
        ).to contain_exactly(snap, crackle)
      end
    end
  end

  context 'when using a seeded Random, with tied matchings in round 2' do
    let(:players) { create_list(:player, 8, tournament:) }
    let(:round1) { create(:round, tournament:, stage:, number: 1, completed: true) }
    let(:round2) { create(:round, tournament:, stage:, number: 2) }

    # Four players on 6 points and four players on 0. Nobody in the same bracket has played yet, so
    # several matchings tie for the best weight and only the seeded shuffle decides between them.
    before do
      players.each_slice(2) do |winner, loser|
        create(:pairing, round: round1, player1: winner, player2: loser, score1: 6, score2: 0)
      end
    end

    def pair_with_seed(seed)
      round2.pairings.destroy_all
      described_class.new(round2, Random.new(seed)).pair!
      round2.reload.pairings.map { |p| [p.player1_id, p.player2_id, p.table_number] }.sort
    end

    it 'produces identical pairings, sides and tables for the same seed' do
      first_run = pair_with_seed(419)
      10.times do
        expect(pair_with_seed(419)).to eq(first_run)
      end
    end

    it 'picks different tied matches for a different seed' do
      seed1_pairings = pair_with_seed(1)
      expect(pair_with_seed(2)).not_to eq(seed1_pairings)
    end
  end

  def pairings_table_by_player(pairings)
    index = {}
    pairings.each do |pairing|
      pairing.players.each do |player|
        index[player.name] = pairing.table_number if player.id
      end
    end
    index
  end
end
