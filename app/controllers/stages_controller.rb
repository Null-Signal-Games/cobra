# frozen_string_literal: true

class StagesController < ApplicationController # rubocop:disable Style/Documentation
  before_action :set_tournament
  before_action :set_stage, only: %i[update settings]

  def update
    authorize @tournament, :update?

    params = stage_params

    # Validate parameters
    error = validate_table_ranges(params[:table_ranges])
    return render json: { error: error }, status: :unprocessable_content if error

    # Save table ranges
    ActiveRecord::Base.transaction do
      @stage.table_ranges.destroy_all
      @stage.table_ranges.create!(params[:table_ranges])
    rescue ActiveRecord::ActiveRecordError => e
      error = "Unable to save stage: #{e}"
    end
    return render json: { error: error }, status: :unprocessable_content if error

    head :ok
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
      warning: stage.validate_table_count
    }
  end

  def table_range_json(stage)
    stage.table_ranges.map do |tr|
      {
        id: tr.id,
        stage_id: tr.stage_id,
        first_table: tr.first_table,
        last_table: tr.last_table
      }
    end
  end

  def validate_table_ranges(new_ranges_params)
    ranges = new_ranges_params.map { |params| TableRange.new(params) }

    ranges.each do |range_a|
      return 'The first table must be less than the last table.' if range_a.first_table > range_a.last_table

      ranges.each do |range_b|
        if range_a != range_b &&
           (range_b.in_range?(range_a.first_table) || range_b.in_range?(range_a.last_table))
          return 'Table ranges cannot overlap.'
        end
      end
    end

    nil
  end
end
