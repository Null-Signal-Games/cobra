# frozen_string_literal: true

module Beta
  class TournamentsController < ApplicationController # rubocop:disable Metrics/ClassLength,Style/Documentation
    before_action :set_tournament, only: %i[
      show update info qr registration open_registration close_registration lock_player_registrations
      unlock_player_registrations cut stats id_and_faction_data cut_conversion_rates
    ]
    before_action :authorize_beta_testing

    def index
      skip_authorization
      @type_id = nil
    end

    def show
      authorize @tournament
    end

    def type
      skip_authorization
      @type_id = params[:type_id]
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

      respond_to do |format|
        format.json do
          errors['base'] = error if error
          if errors.empty?
            head :ok
          else
            render json: { errors: errors.values }, status: :unprocessable_content
          end
        end
      end
    end

    def info
      redirect_to beta_tournament_path(@tournament)
    end

    def qr
      authorize @tournament, :show?

      send_data(RQRCode::QRCode.new(tournament_url(@tournament.slug, request), level: :h)
                               .as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 25),
                type: 'image/svg+xml',
                disposition: 'inline')
    end

    def registration
      authorize @tournament, :register?

      players = @tournament.players.includes(%i[corp_identity_ref runner_identity_ref]).active.sort_by do |p|
        p.name || ''
      end
      @current_user_player = players.find do |p|
        p.user_id == current_user.id
      end
      unless @current_user_player
        redirect_to tournament_path(@tournament)
        return
      end

      return unless @tournament.nrdb_deck_registration?
      return if @current_user_player.registration_locked?

      begin
        @decks = Nrdb::Connection.new(current_user).decks.map do |deck|
          {
            id: deck[:id],
            uuid: deck[:uuid],
            date_creation: deck[:date_creation],
            date_update: deck[:date_update],
            name: deck[:name],
            description: deck[:description],
            mwl_code: deck[:mwl_code],
            tags: deck[:tags],
            cards: deck[:cards].map { |id, count| { id:, count: } }
          }
        end
      rescue StandardError
        redirect_to login_path(return_to: request.path)
      end
    end

    def open_registration
      authorize @tournament, :edit?

      @tournament.open_registration!

      head :ok
    end

    def close_registration
      authorize @tournament, :edit?

      @tournament.close_registration!

      head :ok
    end

    def lock_player_registrations
      authorize @tournament, :edit?

      @tournament.lock_player_registrations!

      head :ok
    end

    def unlock_player_registrations
      authorize @tournament, :edit?

      @tournament.unlock_player_registrations!

      head :ok
    end

    def cut
      authorize @tournament

      number = params[:number].to_i
      format = params[:elimination_type] == 'single' ? :single_elim : :double_elim
      return redirect_to standings_tournament_players_path(@tournament) unless
        Bracket::Factory.valid_bracket?(number, single_elim: format == :single_elim)

      @tournament.cut_to!(format, number)

      head :ok
    end

    def stats
      authorize @tournament, :show?
    end

    def id_and_faction_data
      authorize @tournament, :show?

      data = @tournament.id_and_faction_data

      render json: { swiss: transform_stats(data), elim: transform_stats(data[:cut]) }
    end

    def cut_conversion_rates
      authorize @tournament, :show?

      render json: transform_cut_stats(@tournament.cut_conversion_rates_data)
    end

    private

    def set_tournament
      @tournament = Tournament.find(params[:id])
    end

    def tournament_params
      params.require(:tournament).permit(
        :id, :name, :date, :private, :stream_url, :manual_seed, :self_registration, :allow_streaming_opt_out,
        :nrdb_deck_registration, :cut_deck_visibility, :swiss_deck_visibility, :swiss_format, :time_zone,
        :registration_starts, :tournament_starts, :tournament_type_id, :card_set_id, :format_id,
        :deckbuilding_restriction_id, :decklist_required, :organizer_contact, :event_link, :description,
        :official_prize_kit_id, :additional_prizes_description, :allow_self_reporting,
        # Used for demo tournaments
        :num_players, :num_first_round_byes
      )
    end

    def tournament_url(slug, request)
      server = "#{request.protocol}#{request.host}"
      server += ":#{request.port}" if !request.port.nil? && (request.port != 80) && (request.port != 443)
      "#{server}/#{slug}"
    end

    def transform_stats(stats)
      {
        num_players: stats[:num_players],
        corp: {
          ids: stats[:corp][:ids].keys.map do |id|
            {
              identity: {
                name: id,
                faction: stats[:corp][:ids][id][:faction]
              },
              count: stats[:corp][:ids][id][:count]
            }
          end,
          factions: stats[:corp][:factions].keys.map do |faction|
            {
              name: faction,
              count: stats[:corp][:factions][faction]
            }
          end
        },
        runner: {
          ids: stats[:runner][:ids].keys.map do |id|
            {
              identity: {
                name: id,
                faction: stats[:runner][:ids][id][:faction]
              },
              count: stats[:runner][:ids][id][:count]
            }
          end,
          factions: stats[:runner][:factions].keys.map do |faction|
            {
              name: faction,
              count: stats[:runner][:factions][faction]
            }
          end
        }
      }
    end

    def transform_cut_stats(stats)
      {
        corp: {
          ids: stats[:identities][:corp].keys.map do |id|
            {
              identity: {
                name: id,
                faction: stats[:identities][:corp][id][:faction]
              },
              numSwissPlayers: stats[:identities][:corp][id][:num_swiss_players],
              numCutPlayers: stats[:identities][:corp][id][:num_cut_players],
              cutConversion: stats[:identities][:corp][id][:cut_conversion_percentage]
            }
          end,
          factions: stats[:factions][:corp].keys.map do |faction|
            {
              name: faction,
              numSwissPlayers: stats[:factions][:corp][faction][:num_swiss_players],
              numCutPlayers: stats[:factions][:corp][faction][:num_cut_players],
              cutConversion: stats[:factions][:corp][faction][:cut_conversion_percentage]
            }
          end
        },
        runner: {
          ids: stats[:identities][:runner].keys.map do |id|
            {
              identity: {
                name: id,
                faction: stats[:identities][:runner][id][:faction]
              },
              numSwissPlayers: stats[:identities][:runner][id][:num_swiss_players],
              numCutPlayers: stats[:identities][:runner][id][:num_cut_players],
              cutConversion: stats[:identities][:runner][id][:cut_conversion_percentage]
            }
          end,
          factions: stats[:factions][:runner].keys.map do |faction|
            {
              name: faction,
              numSwissPlayers: stats[:factions][:runner][faction][:num_swiss_players],
              numCutPlayers: stats[:factions][:runner][faction][:num_cut_players],
              cutConversion: stats[:factions][:runner][faction][:cut_conversion_percentage]
            }
          end
        }
      }
    end
  end
end
