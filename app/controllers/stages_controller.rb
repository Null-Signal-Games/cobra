# frozen_string_literal: true

class StagesController < ApplicationController
  before_action :set_tournament
  before_action :set_stage, only: %i[show update destroy settings]

  def show
    authorize @tournament, :update?
  end

  def create
    authorize @tournament, :update?

    stage = @tournament.stages.create(format: (@tournament.single_sided? ? :single_sided_swiss : :swiss))
    @tournament.players.each { |p| stage.players << p }

    render json: { url: tournament_rounds_path(@tournament) }, status: :ok
  end

  def update
    authorize @tournament, :update?

    params = stage_params

    # Validate parameters
    error = validate_table_ranges(params[:table_ranges])
    if error
      flash.now[:alert] = error
      return render json: { error: error }, status: :unprocessable_entity
    end

    # Save table ranges
    ActiveRecord::Base.transaction do
      @stage.table_ranges.destroy_all
      @stage.table_ranges.create!(params[:table_ranges])
    rescue ActiveRecord::ActiveRecordError => e
      error = "Unable to save stage: #{e}"
    end
    if error
      flash.now[:alert] = error
      return render json: { error: error }, status: :unprocessable_entity
    end

    render json: { url: tournament_stage_path(@tournament, @stage) }, status: :ok
  end

  def destroy
    authorize @tournament, :update?

    @stage.destroy!

    render json: { url: tournament_rounds_path(@tournament) }, status: :ok
  end

  def settings
    authorize @tournament, :update?

    render json: stage_json(@stage), status: :ok
  end

  def set_stage
    @stage = Stage.find(params[:id])
  end

  private

  def stage_params
    params.require(:stage).permit(:id, :tournament_id, :number, :format,
                                  table_ranges: %i[id stage_id first_table last_table])
  end

  def stage_json(stage)
    {
      stage: {
        id: stage.id,
        tournament_id: stage.tournament_id,
        number: stage.number,
        format: stage.format.titleize,
        table_ranges: table_range_json(stage)
      },
      warning: stage.validate_table_count,
      csrf_token: form_authenticity_token
    }
  end

  def table_range_json(stage)
    table_ranges = []

    stage.table_ranges.each do |tr|
      table_ranges << {
        id: tr.id,
        stage_id: tr.stage_id,
        first_table: tr.first_table,
        last_table: tr.last_table
      }
    end

    table_ranges
  end

  def validate_table_ranges(new_ranges_params)
    ranges = new_ranges_params.map { |params| TableRange.new(params) }

    ranges.each do |range_a|
      return 'The first table must be less than the last table.' if range_a.first_table > range_a.last_table

      ranges.each do |range_b|
        if range_a != range_b && \
           (range_b.in_range?(range_a.first_table) || range_b.in_range?(range_a.last_table))
          return 'Table ranges cannot overlap.'
        end
      end
    end

    nil
  end
end
