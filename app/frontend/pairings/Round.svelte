<script lang="ts">
  import type { Stage, Round, TournamentPolicies } from "./PairingsData";
  import Pairing from "./Pairing.svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import { redirectRequest } from "../utils/requests";

  interface Props {
    tournamentId: number;
    stage: Stage;
    round: Round;
    startExpanded: boolean;
    showReportedPairings: boolean;
    tournamentPolicies?: TournamentPolicies;
    csrfToken?: string;
  }

  let {
    tournamentId,
    stage,
    round,
    startExpanded,
    showReportedPairings = true,
    tournamentPolicies,
    csrfToken = "",
  }: Props = $props();

  function completeRound(e: MouseEvent) {
    if (round.pairings.length != round.pairings_reported
      && !confirm(
        "Are you sure you want to complete this round? Are all pairings reported?",
      )
    ) {
      return;
    }

    redirectRequest(
      e,
      `/tournaments/${tournamentId}/rounds/${round.id}/complete?completed=true`,
      "PATCH",
      csrfToken,
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
        <FontAwesomeIcon icon="list-ul" />
        Pairings by name
      </a>

      <!-- Pairings -->
      {#each round.pairings as pairing (pairing.id)}
        {#if showReportedPairings || pairing.score_label === "-"}
          <Pairing {tournamentId} {pairing} {round} {stage} />
        {/if}
      {/each}
    </div>
  </div>
</div>
