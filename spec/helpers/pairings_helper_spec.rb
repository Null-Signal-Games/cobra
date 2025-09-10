# frozen_string_literal: true

RSpec.describe PairingsHelper do
  describe '#single_sided_swiss_presets' do
    let(:tournament) { create(:tournament, swiss_format: :single_sided) }
    let(:stage) { tournament.current_stage }

    context 'when player 1 is corp' do
      let(:pairing) { create(:pairing, stage:, side: :player1_is_corp) }

      it 'returns single-sided swiss defaults' do
        expect(helper.presets(pairing)).to eq(
          [
            { score1_corp: 3, score2_runner: 0, score1_runner: 0, score2_corp: 0, intentional_draw: false,
              label: 'Corp Win' },
            { score1_corp: 1, score2_runner: 1, score1_runner: 0, score2_corp: 0, intentional_draw: false,
              label: 'Tie' },
            { score1_corp: 1, score2_runner: 1, score1_runner: 0, score2_corp: 0, intentional_draw: true,
              label: 'Intentional Draw' },
            { score1_corp: 0, score2_runner: 3, score1_runner: 0, score2_corp: 0, intentional_draw: false,
              label: 'Runner Win' }
          ]
        )
      end
    end

    context 'when player 1 is runner' do
      let(:pairing) { create(:pairing, stage:, side: :player1_is_runner) }

      it 'returns single-sided swiss defaults' do
        expect(helper.presets(pairing)).to eq(
          [
            { score1_corp: 0, score2_runner: 0, score1_runner: 0, score2_corp: 3, intentional_draw: false,
              label: 'Corp Win' },
            { score1_corp: 0, score2_runner: 0, score1_runner: 1, score2_corp: 1, intentional_draw: false,
              label: 'Tie' },
            { score1_corp: 0, score2_runner: 0, score1_runner: 1, score2_corp: 1, intentional_draw: true,
              label: 'Intentional Draw' },
            { score1_corp: 0, score2_runner: 0, score1_runner: 3, score2_corp: 0, intentional_draw: false,
              label: 'Runner Win' }
          ]
        )
      end
    end

    describe '#sss_readable_score' do
      let(:sss_bye) { create(:pairing, stage: tournament.current_stage, score1: 3, score2: 0, player2: nil, side: nil) }

      it 'outputs correct score description in sss' do
        aggregate_failures do
          expect(helper.readable_score(sss_bye)).to eq('3 - 0')
        end
      end
    end
  end

  describe '#presets' do
    let(:tournament) { create(:tournament) }
    let(:stage) { tournament.current_stage }
    let(:pairing) { create(:pairing, stage:) }

    context 'for double-sided swiss' do
      it 'returns swiss defaults' do
        expect(helper.presets(pairing)).to eq(
          [
            { score1_corp: 3, score2_runner: 0, score1_runner: 3, score2_corp: 0, label: '6-0' },
            { score1_corp: 3, score2_runner: 0, score1_runner: 0, score2_corp: 3, label: '3-3 (C)' },
            { score1_corp: 0, score2_runner: 3, score1_runner: 3, score2_corp: 0, label: '3-3 (R)' },
            { score1_corp: 0, score2_runner: 3, score1_runner: 0, score2_corp: 3, label: '0-6' }
          ]
        )
      end
    end

    context 'for double elim' do
      let(:stage) { create(:stage, tournament:, format: :double_elim) }

      context 'when side is unknown' do
        it 'returns double elim defaults' do
          expect(helper.presets(pairing)).to eq(
            [
              { score1: 3, score2: 0, score1_corp: 0, score2_runner: 0, score1_runner: 0, score2_corp: 0,
                label: '3-0' },
              { score1: 0, score2: 3, score1_corp: 0, score2_runner: 0, score1_runner: 0, score2_corp: 0, label: '0-3' }
            ]
          )
        end
      end

      context 'when player 1 is corp' do
        let(:pairing) { create(:pairing, stage:, side: :player1_is_corp) }

        it 'returns double elim defaults' do
          expect(helper.presets(pairing)).to eq(
            [
              { score1: 3, score1_corp: 3, score1_runner: 0, score2: 0, score2_corp: 0, score2_runner: 0,
                label: '3-0', extra_self_report_label: "#{pairing.player1.name} wins" },
              { score1: 0, score1_corp: 0, score1_runner: 0, score2: 3, score2_corp: 0, score2_runner: 3, label: '0-3', extra_self_report_label: "#{pairing.player2.name} wins" }
            ]
          )
        end
      end

      context 'when player 1 is runner' do
        let(:pairing) { create(:pairing, stage:, side: :player1_is_runner) }

        it 'returns double elim defaults' do
          expect(helper.presets(pairing)).to eq(
            [
              { score1: 0, score1_corp: 0, score1_runner: 0, score2: 3, score2_corp: 3, score2_runner: 0,
                label: '3-0', extra_self_report_label: "#{pairing.player2.name} wins" },
              { score1: 3, score1_corp: 0, score1_runner: 3, score2: 0, score2_corp: 0, score2_runner: 0,
                label: '0-3', extra_self_report_label: "#{pairing.player1.name} wins" }
            ]
          )
        end
      end
    end
  end

  describe '#side_options' do
    it 'returns correct options' do
      expect(helper.side_options).to eq([
                                          %w[player1_is_corp player1_is_corp],
                                          %w[player1_is_runner player1_is_runner]
                                        ])
    end
  end

  describe '#side_label_for' do
    let(:pairing) { create(:pairing, side: :player1_is_corp) }
    let(:undeclared) { create(:pairing, side: nil) }

    it 'returns side' do
      aggregate_failures do
        expect(helper.side_label_for(pairing, pairing.player1)).to eq('(Corp)')
        expect(helper.side_label_for(pairing, pairing.player2)).to eq('(Runner)')
      end
    end

    it 'returns nil for undeclared' do
      expect(helper.side_label_for(undeclared, undeclared.player1)).to be_nil
    end

    it 'returns nil for invalid player' do
      expect(helper.side_label_for(pairing, undeclared.player1)).to be_nil
    end
  end

  describe '#side_value' do
    let(:jack) { create(:player) }
    let(:jill) { create(:player) }
    let(:other) { create(:player) }
    let(:pairing) { create(:pairing, player1: jack, player2: jill) }

    it 'calculates side correctly' do
      aggregate_failures do
        expect(helper.side_value(other, :corp, pairing)).to be_nil
        expect(helper.side_value(jack, :corp, pairing)).to eq(:player1_is_corp)
        expect(helper.side_value(jill, :corp, pairing)).to eq(:player1_is_runner)
        expect(helper.side_value(jack, :runner, pairing)).to eq(:player1_is_runner)
        expect(helper.side_value(jill, :runner, pairing)).to eq(:player1_is_corp)
      end
    end
  end

  describe '#readable_score' do
    let(:sweep) { create(:pairing, score1_corp: 3, score1_runner: 3) }
    let(:runner_split) { create(:pairing, score1_runner: 3, score2_runner: 3) }
    let(:corp_split) { create(:pairing, score1_corp: 3, score2_corp: 3) }
    let(:swept) { create(:pairing, score2_corp: 3, score2_runner: 3) }
    let(:unreported) { create(:pairing) }
    let(:unusual) { create(:pairing, score1_corp: 3, score1_runner: 1, score2_corp: 1) }
    let(:undeclared_sides) { create(:pairing, score1: 3, score2: 3) }

    it 'outputs correct score description' do
      aggregate_failures do
        expect(helper.readable_score(sweep)).to eq('6 - 0')
        expect(helper.readable_score(runner_split)).to eq('3 - 3 (R)')
        expect(helper.readable_score(corp_split)).to eq('3 - 3 (C)')
        expect(helper.readable_score(swept)).to eq('0 - 6')
        expect(helper.readable_score(unreported)).to eq('-')
        expect(helper.readable_score(unusual)).to eq('4 - 1 (C)')
        expect(helper.readable_score(undeclared_sides)).to eq('3 - 3')
      end
    end
  end
end
