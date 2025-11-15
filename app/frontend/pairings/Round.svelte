<script lang="ts">
  import type { Stage, Round, TournamentPolicies, Tournament } from "./PairingsData";
  import Pairing from "./Pairing.svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import { redirectRequest } from "../utils/network";

  let {
    tournamentId,
    tournament,
    stage,
    round,
    startExpanded,
    showReportedPairings = true,
    tournamentPolicies,
    csrfToken,
  }: {
    tournamentId: number;
    tournament: Tournament;
    stage: Stage;
    round: Round;
    startExpanded: boolean;
    showReportedPairings: boolean;
    tournamentPolicies?: TournamentPolicies;
    csrfToken: string;
  } = $props();

  let roundTimerLength = $state(round.length_minutes);

  function completeRound(e: MouseEvent) {
    e.preventDefault();

    if (round.pairings.length != round.pairings_reported
      && !confirm(
        "Are you sure you want to complete this round? Are all pairings reported?",
      )
    ) {
      return;
    }

    redirectRequest(
      `/tournaments/${tournamentId}/rounds/${round.id}/complete`,
      "PATCH",
      csrfToken,
      { completed: true }
    );
  }

  function updateTimer(e: MouseEvent, operation: string) {
    e.preventDefault();

    if (operation === "reset"
      && !confirm("This will clear all elapsed time in the round. Are you sure?")
    ) {
      return;
    }

    redirectRequest(
      `/tournaments/${tournamentId}/rounds/${round.id}/update_timer`,
      "PATCH",
      csrfToken,
      { length_minutes: roundTimerLength, operation: operation }
    );
  }
</script>

<div class="card">
  <div class="card-header" role="tab">
    <div class="row">
      <div class="col-sm-9">
        <a data-toggle="collapse" href="#round{round.id}">
          <h5 class="mb-0">Round {round.number}</h5>
        </a>
      </div>
      <div class="col-sm-3">
        {round.pairings_reported} / {round.pairings.length} pairings reported
      </div>
    </div>
  </div>

  <div class="collapse{startExpanded ? ' show' : ''}" id="round{round.id}">
    <div class="col-12 my-3">
      <!-- Admin controls -->
      {#if tournamentPolicies?.update}
        <a class="btn btn-warning" href="/tournaments/{tournamentId}/rounds/{round.id}">
          <FontAwesomeIcon icon="pencil" /> Edit
        </a>
        {#if !round.completed}
          <button class="btn btn-warning" onclick={completeRound}>
            <FontAwesomeIcon icon="check" /> Complete
          </button>
        {/if}
        <a class="btn btn-primary" href="/tournaments/{tournamentId}/rounds/{round.id}/pairings/match_slips">
          <FontAwesomeIcon icon="flag-checkered" /> Match slips
        </a>
        <a class="btn btn-primary" href="/tournaments/{tournamentId}/rounds/{round.id}/pairings/sharing">
          <FontAwesomeIcon icon="share" /> Export markdown
        </a>
      {/if}
      <a class="btn btn-primary" href="{round.id}/pairings">
        <FontAwesomeIcon icon="list-ul" /> Pairings by name
      </a>

      <!-- Timer -->
      {#if tournamentPolicies?.update && !round.completed}
        <div class="form-inline mt-2">
          <div class="form-group">
            <label for="round{round.id}Length">Round timer length (minutes)</label>
            <input id="round{round.id}Length" size="3" class="form-control ml-2 mr-2" value={roundTimerLength} />
            {#if round.timer.running}
              <button class="btn btn-danger" onclick={(e) => updateTimer(e, "stop")}>
                <FontAwesomeIcon icon="clock-o" /> Pause
              </button>
            {:else if round.timer.paused}
              <button class="btn btn-success" onclick={(e) => updateTimer(e, "start")}>
                <FontAwesomeIcon icon="clock-o" /> Resume
              </button>
            {:else if !round.timer.started}
              <button class="btn btn-success" onclick={(e) => updateTimer(e, "start")}>
                <FontAwesomeIcon icon="clock-o" /> Start
              </button>
            {/if}
            <button class="btn btn-info ml-2" onclick={(e) => updateTimer(e, "reset")}>
              <FontAwesomeIcon icon="undo" /> Reset
            </button>
          </div>
        </div>
      {/if}

      <!-- Pairings -->
      {#each round.pairings as pairing (pairing.id)}
        {#if showReportedPairings || !pairing.reported}
          {#if tournamentPolicies?.update}
            <hr />
          {/if}
          <Pairing {tournamentId} {tournament} {pairing} {round} {stage} {tournamentPolicies} {csrfToken} />
        {/if}
      {/each}
    </div>
  </div>
</div>
