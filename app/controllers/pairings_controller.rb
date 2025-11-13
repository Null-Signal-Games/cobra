# frozen_string_literal: true

class PairingsController < ApplicationController
  before_action :set_tournament
  before_action :round, only: %i[sharing markdown]
  attr_reader :tournament

  def index
    authorize @tournament, :show?

    @pairings = round.pairings.includes(:player1, :player2).inject([]) do |pairings, p|
      pairings << {
        table_number: p.table_number,
        player1_name: p.player1.name_with_pronouns,
        player1_side: p.side == 'player1_is_corp' ? ' (Corp)' : ' (Runner)',
        player2_name: p.player2.name_with_pronouns,
        player2_side: p.side == 'player1_is_corp' ? ' (Runner)' : ' (Corp)',
        pairing: p
      }
      pairings << {
        table_number: p.table_number,
        player1_name: p.player2.name_with_pronouns,
        player1_side: p.side == 'player1_is_corp' ? ' (Runner)' : ' (Corp)',
        player2_name: p.player1.name_with_pronouns,
        player2_side: p.side == 'player1_is_corp' ? ' (Corp)' : ' (Runner)',
        pairing: p
      }
    end
    @pairings = @pairings.sort_by do |p|
      p[:player1_name].downcase
    end
  end

  def sharing
    authorize @tournament, :show?
  end

  def markdown
    authorize @tournament, :show?

    page_header = "# #{@round.stage.format.titleize} - Round #{@round.number} Pairings"

    # Retrieve pairing data
    sql = ActiveRecord::Base.sanitize_sql(
      [
        'SELECT * FROM summarized_pairings WHERE tournament_id = ? AND round_id = ? ORDER BY table_number',
        @tournament.id, @round.id
      ]
    )
    rows = ActiveRecord::Base.connection.exec_query(sql).to_a

    # Construct markdown pages
    pages = []
    current_page = page_header
    rows.each do |p|
      table_md = "\n### Table #{p['table_number']}"
      table_md += "\n- #{pairing_player_markdown(
        p['player1_name'], p['player1_pronouns'], p['side'] == Pairing.sides[:player1_is_corp]
      )}"
      table_md += "\n- #{pairing_player_markdown(
        p['player2_name'], p['player2_pronouns'], p['side'] == Pairing.sides[:player2_is_corp]
      )}"

      # Pages are capped at 2000 characters to fit within a single Discord message
      if current_page.length + table_md.length >= 2000
        pages.append(current_page)
        current_page = page_header
      end

      current_page += table_md
    end

    pages.append(current_page)

    render json: { pages: }
  end

  def create
    authorize @tournament, :update?

    round.pairings.create(pairing_params)

    redirect_to tournament_round_path(tournament, round)
  end

  def report
    authorize @tournament, :update?

    save_report

    render json: { url: tournament_rounds_path(@tournament) }, status: :ok
  end

  def reset_self_report
    authorize @tournament, :update?

    SelfReport.where(pairing_id: pairing.id).destroy_all

    render json: { url: tournament_rounds_path(@tournament) }, status: :ok
  end

  def self_report
    authorize @tournament, :self_report?
    authorize pairing, :can_self_report?

    self_report_score = self_report_score_params.merge(pairing_id: pairing.id).merge(report_player_id: current_user.id)
    SelfReport.create(self_report_score)

    # if both players have reported and the reported scores match, finalize scores for the pairing
    reports = Pairing.find(params[:id]).self_reports

    if reports.size == 2

      # if reports don't match, do nothing (later replaced by notification)
      if reports[0].score1 != reports[1].score1 ||
         reports[0].score2 != reports[1].score2 ||
         reports[0].score1_corp != reports[1].score1_corp ||
         reports[0].score2_corp != reports[1].score2_corp ||
         reports[0].score1_runner != reports[1].score1_runner ||
         reports[0].score2_runner != reports[1].score2_runner

        return render json: { success: true }, status: :ok
      end

      save_report

    end
    render json: { success: true }, status: :ok
  end

  def destroy
    authorize @tournament, :update?

    pairing.destroy

    render json: { url: tournament_rounds_path(@tournament) }, status: :ok
  end

  def match_slips
    authorize @tournament, :edit?

    @pairings = if params[:collate]
                  round.collated_pairings
                else
                  round.pairings
                end
  end

  def view_decks
    authorize @tournament, :show?
    authorize pairing
    @back_to = params[:back_to]
    if @back_to == 'pairings'
      @back_to_path = view_pairings_tournament_rounds_path(@tournament)
    elsif @back_to == 'standings'
      @back_to_path = standings_tournament_players_path(@tournament)
    end
  end

  def pairing_presets
    authorize @tournament, :show?
    render json: { presets: helpers.presets(pairing), csrf_token: form_authenticity_token }
  end

  private

  def save_report
    pairing.update(score_params)

    return unless score_params.key?('side') && pairing.reported?

    score1_corp = pairing.score1_corp
    pairing.score1_corp = pairing.score1_runner
    pairing.score1_runner = score1_corp

    score2_corp = pairing.score2_corp
    pairing.score2_corp = pairing.score2_runner
    pairing.score2_runner = score2_corp

    pairing.save
  end

  def round
    @round ||= Round.find(params[:round_id])
  end

  def pairing
    @pairing ||= Pairing.find(params[:id])
  end

  def pairing_params
    params.require(:pairing).permit(:player1_id, :player2_id, :table_number, :side)
  end

  def score_params
    params.require(:pairing)
          .permit(:score1_runner, :score1_corp, :score2_runner, :score2_corp,
                  :score1, :score2, :side, :intentional_draw, :two_for_one)
  end

  def self_report_score_params
    params.require(:pairing)
          .permit(:score1_runner, :score1_corp, :score2_runner, :score2_corp,
                  :score1, :score2, :side, :intentional_draw, :two_for_one)
  end

  def pairing_player_markdown(name, pronouns, is_corp)
    markdown = "**#{name}**"
    markdown += " *(#{pronouns})*" if pronouns.present?
    markdown += " - #{is_corp ? 'Corp' : 'Runner'}" if @round.stage.single_sided?
    markdown
  end
end
