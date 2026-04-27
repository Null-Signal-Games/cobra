# frozen_string_literal: true

module Beta
  class PlayersController < ApplicationController # rubocop:disable Metrics/ClassLength,Style/Documentation
    before_action :set_tournament
    before_action :set_player, only: %i[update destroy lock_registration unlock_registration drop reinstate]

    def index
      authorize @tournament, :update?
    end

    def players_data
      authorize @tournament, :update?

      # TODO: Create a single query to fetch all players and then split the active/dropped results in this controller
      players = @tournament.players.active.sort_by { |p| p.name.downcase || '' }
      dropped = @tournament.players.dropped.sort_by { |p| p.name.downcase || '' }

      render json: {
        tournament: helpers.tournament_json(@tournament),
        tournamentPolicies: helpers.tournament_policies_json(@tournament),
        activePlayers: players.map do |player|
          helpers.player_json(player)
        end,
        droppedPlayers: dropped.map do |player|
          helpers.player_json(player)
        end
      }
    end

    def create
      authorize Player
      if @tournament.registration_open?
        authorize @tournament, :show?
      else
        authorize @tournament, :update?
      end

      params = player_params
      params[:user_id] = current_user.id

      if @tournament.players.any? { |p| p.name == params[:name] }
        render json: { player: helpers.player_json(nil),
                       errors: ["A user with the name #{params[:name]} is already registered for this event."] }
        return
      end

      player = @tournament.players.create(params.except(:corp_deck, :runner_deck))
      @tournament.current_stage.players << player unless @tournament.current_stage.nil?
      @tournament.update(any_player_unlocked: true,
                         all_players_unlocked: @tournament.locked_players.none?)

      render json: { player: helpers.player_json(player) }
    end

    def update
      authorize @player

      update = player_params
      update[:user_id] = current_user.id unless organiser_view?

      @player.update(update.except(:corp_deck, :runner_deck))
      if @tournament.nrdb_deck_registration?
        save_deck(update, :corp_deck, 'corp')
        save_deck(update, :runner_deck, 'runner')
      end

      render json: { player: helpers.player_json(@player) }
    end

    def destroy
      authorize @tournament, :update?

      @player.destroy
      @tournament.update(any_player_unlocked: @tournament.unlocked_players.any?,
                         all_players_unlocked: @tournament.locked_players.none?)

      head :ok
    end

    def by_user_id
      authorize @tournament, :show?

      render json: helpers.player_json(@tournament.players.find { |p|
        p.user_id == params[:user_id].to_i
      })
    end

    def lock_registration
      authorize @tournament, :update?

      @player.update(registration_locked: true)
      @tournament.update(all_players_unlocked: false,
                         any_player_unlocked: @tournament.unlocked_players.any?)

      head :ok
    end

    def unlock_registration
      authorize @tournament, :update?

      @player.update(registration_locked: false)
      @tournament.update(any_player_unlocked: true,
                         all_players_unlocked: @tournament.locked_players.none?)

      head :ok
    end

    def drop
      authorize @tournament, :update?

      @player.update(active: false)

      head :ok
    end

    def reinstate
      authorize @tournament, :update?

      @player.update(active: true)

      head :ok
    end

    def decks
      authorize @tournament, :update?

      render json: @tournament.players
                   .sort_by(&:name)
                   .flat_map { |p| p.decks.sort_by(&:side_id) }
                   .map { |d| d.as_view(current_user) }
    end

    private

    def set_player
      @player = Player.find(params[:id])
    end

    def player_params
      params.require(:player)
            .permit(%i[name pronouns corp_identity runner_identity corp_deck runner_deck
                       first_round_bye manual_seed include_in_stream fixed_table_number])
    end

    def organiser_view?
      @tournament.user_id == current_user.id
    end

    def save_deck(params, param, side)
      return unless params.key?(param)

      begin
        request = JSON.parse(params[param])
      rescue StandardError
        @player.decks.destroy_by(side_id: side)
        return
      end
      details = request['details']
      return if details['user_id'] && details['user_id'] != current_user.id

      details.keep_if { |key| Deck.column_names.include? key }
      details['side_id'] = side
      details['user_id'] = current_user.id
      @player.decks.destroy_by(side_id: side)
      deck = @player.decks.create(details)
      deck.cards.create(request['cards'])
    end
  end
end
