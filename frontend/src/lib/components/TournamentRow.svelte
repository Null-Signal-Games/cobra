<script lang="ts">
  import type { TournamentInfo } from "$lib/utils/api_types";

  let {
    showDelete,
    tournament,
    userId,
    tournamentTypeName = null,
  }: {
    showDelete: boolean;
    tournament: TournamentInfo;
    userId: number | null;
    tournamentTypeName?: string | null;
  } = $props();
</script>

<div class="tournament card m-3">
  <div class="card-body">
    <h4 class="card-title">
      <a href={`http://localhost:3000/beta/tournaments/${tournament.id}`}>
        {tournament.attributes.name}
      </a>
      {#if tournamentTypeName}
        <span
          style="font-size: .7em; position: relative; top: -.1em;"
          class="badge badge-pill badge-secondary"
        >
          {tournamentTypeName}
        </span>
      {/if}
    </h4>

    <h6 class="card-subtitle mb-2 text-muted">
      {#if tournament.attributes.date}
        {new Date(tournament.attributes.date).toLocaleString(
          navigator.languages,
          {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          },
        )} -
      {/if}
      {tournament.attributes.active_player_count}
      {new Intl.PluralRules(navigator.languages).select(
        tournament.attributes.active_player_count,
      ) == "one"
        ? "active player"
        : "active players"}
      {#if tournament.attributes.tournament_organizer}
        - {tournament.attributes.tournament_organizer}
      {/if}
      {#if tournament.attributes.stream_url}
        - <i class="fa fa-video-camera"></i>
      {/if}
    </h6>

    {#if showDelete && userId !== null && tournament.attributes.user_id === userId}
      <div class="delete_action">
        <a
          href={`http://localhost:3000/beta/tournaments/${tournament.id}`}
          data-method="delete"
          class="btn btn-danger"
          data-confirm="Are you sure? This cannot be reversed."
        >
          <i class="fa fa-trash-o"></i> Delete
        </a>
      </div>
    {/if}
  </div>
</div>
