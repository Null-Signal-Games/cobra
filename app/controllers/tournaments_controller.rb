# frozen_string_literal: true

# JSON endpoints for the SvelteKit frontend (/api/classic) and the public NRTM export.
class TournamentsController < ApplicationController # rubocop:disable Metrics/ClassLength
  before_action :set_tournament, only: %i[show edit_form update upload_to_abr save_json]

  def show
    authorize @tournament

    headers['Access-Control-Allow-Origin'] = '*'
    render json: NrtmJson.new(@tournament, root_url).data(tournament_shortlink_url(slug: @tournament.slug))
  end

  def new_form
    authorize Tournament

    @new_tournament = current_user.tournaments.new
    @new_tournament.date = Date.current
    @new_tournament.swiss_format = :single_sided
    render json: helpers.tournament_settings_json(@new_tournament), status: :ok
  end

  def new_demo_form
    authorize Tournament

    render json: helpers.demo_tournament_json, status: :ok
  end

  def create
    authorize Tournament

    @new_tournament = current_user.tournaments.new(tournament_params)

    if @new_tournament.save
      render json: {
        id: @new_tournament.id,
        name: @new_tournament.name,
        url: tournament_path(@new_tournament)
      }, status: :created
    else
      # Determine appropriate status code based on whether there are validation errors
      status_code = @new_tournament.errors.any? ? :unprocessable_content : :internal_server_error
      render json: { errors: @new_tournament.errors }, status: status_code
    end
  end

  def create_demo
    authorize Tournament

    # We will do basic validation here, while farming out a successful creation to the library code.
    errors = {}

    errors[:name] = 'You must provide a name for the tournament' if params[:tournament][:name].blank?

    if params[:tournament][:num_players].blank? || !params[:tournament][:num_players].match?(/^\d+$/)
      errors[:num_players] = 'You must provide a number of players'
    end
    if params[:tournament][:num_first_round_byes].present? &&
       !params[:tournament][:num_first_round_byes].match?(/^\d+$/)
      errors[:num_first_round_byes] = 'Number of byes must be a number'
    end

    if errors.empty?
      tournament = DemoTournament.create(
        tournament_name: params[:tournament][:name],
        format: params[:tournament][:swiss_format],
        first_round_byes: params[:tournament][:num_first_round_byes].to_i,
        num_players: params[:tournament][:num_players].to_i,
        assign_ids: params[:tournament][:assign_ids].present?,
        owner: current_user
      )
      render json: {
        id: tournament.id,
        name: tournament.name,
        url: "#{tournament_path(tournament)}/rounds"
      }, status: :created
    else
      render json: { errors: }, status: :unprocessable_content
    end
  end

  def edit_form
    authorize @tournament
    render json: helpers.tournament_settings_json(@tournament)
  end

  def update
    authorize @tournament

    params = tournament_params

    error = nil
    errors = {}

    if params[:swiss_format] != @tournament.swiss_format
      first_stage = @tournament.stages.first
      if !first_stage.nil? &&
         ((params[:swiss_format] == 'single_sided' && first_stage.swiss?) ||
         (params[:swiss_format] == 'double_sided' && first_stage.single_sided_swiss?))
        if @tournament.rounds.empty?
          case params[:swiss_format] # rubocop:disable Metrics/BlockNesting
          when 'single_sided'
            first_stage.single_sided_swiss!
          when 'double_sided'
            first_stage.swiss!
          end
          first_stage.save
        else
          error = "Can't change Swiss format when rounds exist."
        end
      end
    end

    unless error
      if params[:swiss_deck_visibility]
        unless params[:cut_deck_visibility]
          params[:cut_deck_visibility] = Tournament.max_visibility_cut_or_swiss(
            @tournament.cut_deck_visibility, params[:swiss_deck_visibility]
          )
        end
      elsif params[:cut_deck_visibility]
        params[:swiss_deck_visibility] = Tournament.min_visibility_swiss_or_cut(
          @tournament.swiss_deck_visibility, params[:cut_deck_visibility]
        )
      end
      errors = @tournament.errors unless @tournament.update(params)
    end

    errors['base'] = error if error
    if errors.empty?
      head :no_content
    else
      render json: { errors: errors }, status: :unprocessable_content
    end
  end

  def upload_to_abr
    authorize @tournament

    response = AbrUpload.upload!(@tournament, root_url, tournament_shortlink_url(slug: @tournament.slug))
    @tournament.update(abr_code: response[:code]) if response[:code]

    if response[:code]
      render json: { abr_code: @tournament.abr_code }
    else
      render json: { error: response[:error] || 'Upload to Always Be Running failed.' },
             status: :unprocessable_content
    end
  end

  def save_json
    authorize @tournament

    data = NrtmJson.new(@tournament, root_url).data(tournament_shortlink_url(slug: @tournament.slug))

    send_data data.to_json,
              type: :json,
              disposition: :attachment,
              filename: "#{@tournament.name.underscore}.json"
  end

  private

  def set_tournament
    @tournament = Tournament.find(params[:id])
  end

  def tournament_params
    params.require(:tournament).permit(:name, :date, :private, :stream_url, :manual_seed,
                                       :self_registration, :allow_streaming_opt_out, :nrdb_deck_registration,
                                       :cut_deck_visibility, :swiss_deck_visibility, :swiss_format,
                                       :time_zone, :registration_starts, :tournament_starts, :tournament_type_id,
                                       :card_set_id, :format_id, :deckbuilding_restriction_id, :decklist_required,
                                       :organizer_contact, :event_link, :description, :official_prize_kit_id,
                                       :additional_prizes_description, :allow_self_reporting,
                                       # Used for demo tournaments
                                       :num_players, :num_first_round_byes)
  end
end
