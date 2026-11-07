# frozen_string_literal: true

# Score labels are "-" only when no score has been entered (nil scores). A real 0-0 score, whether
# entered by the TO or self-reported, is shown as "0 - 0".
RSpec.describe 'pairings_data score labels' do
  let(:organiser) { create(:user) }
  let(:tournament) { create(:tournament, user: organiser) }
  let(:round) { tournament.new_round! }
  let(:player1) { create(:player, tournament:) }
  let(:player2) { create(:player, tournament:) }
  let(:player3) { create(:player, tournament:) }
  let(:player4) { create(:player, tournament:) }
  let!(:scored_zero) do
    create(:pairing, round:, player1:, player2:, table_number: 1,
                     score1: 0, score1_corp: 0, score1_runner: 0,
                     score2: 0, score2_corp: 0, score2_runner: 0)
  end
  let!(:unreported) do
    create(:pairing, round:, player1: player3, player2: player4, table_number: 2, score1: nil, score2: nil)
  end

  before do
    SelfReport.create!(pairing: unreported, report_player_id: organiser.id,
                       score1: 0, score1_corp: 0, score1_runner: 0,
                       score2: 0, score2_corp: 0, score2_runner: 0)
    sign_in organiser
  end

  def pairings_by_id
    response.parsed_body['stages'].flat_map { |s| s['rounds'] }
                                  .flat_map { |r| r['pairings'] }
                                  .index_by { |p| p['id'] }
  end

  shared_examples 'labels 0-0 scores' do
    it 'labels a TO-entered 0-0 as "0 - 0"' do
      expect(pairings_by_id[scored_zero.id]['score_label']).to eq('0 - 0')
    end

    it 'labels an unreported pairing as "-"' do
      expect(pairings_by_id[unreported.id]['score_label']).to eq('-')
    end
  end

  describe 'RoundsController' do
    before { get pairings_data_tournament_rounds_path(tournament) }

    it_behaves_like 'labels 0-0 scores'

    # Only the classic endpoint labels self reports; the beta pages format them client-side.
    it 'labels a 0-0 self report as "0 - 0"' do
      expect(pairings_by_id[unreported.id]['self_reports'].first['label']).to eq('0 - 0')
    end
  end

  describe 'Beta::RoundsController' do
    before do
      Flipper.enable(:beta_testing)
      get pairings_data_beta_tournament_rounds_path(tournament)
    end

    it_behaves_like 'labels 0-0 scores'
  end
end
