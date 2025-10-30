<script lang="ts">
  import { onMount } from "svelte";
  import Stage from "./Stage.svelte";
  import { PairingsData, loadPairings } from "./PairingsData";
  import { showIdentities } from "./ShowIdentities";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import ModalDialog from "../widgets/ModalDialog.svelte";

  interface Props {
    tournamentId: number;
  }

  let { tournamentId }: Props = $props();

  let data = $state(new PairingsData());
  let showReportedPairings = $state(true);

  onMount(async () => {
    data = await loadPairings(tournamentId);
  });

  function addSwissStage(e: MouseEvent) {
    e.preventDefault();

    fetch(`/tournaments/${tournamentId}/stages`, {
      method: "POST",
      headers: { "X-CSRF-Token": data.csrf_token },
    }).then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      }
    });
  }
</script>

<!-- Upper controls -->
<div class="mb-3">
  {#if data.stages && data.stages.length > 0}
    {#if data.stages.some((s) => s.rounds && s.rounds.length > 0)}
      <div>
        {#if data.policy.update}
          <button
            class="btn btn-primary"
            onclick={(_) => (showReportedPairings = !showReportedPairings)}
          >
            <FontAwesomeIcon icon="eye-slash" /> Show/hide reported pairings
          </button>
        {/if}
        <button
          class="btn btn-primary"
          onclick={(_) => showIdentities.update((value) => !value)}
        >
          <FontAwesomeIcon icon="eye-slash" /> Show/hide identities
        </button>
        <a
          href="/tournaments/{tournamentId}/rounds/view_pairings"
          class="btn btn-primary"
        >
          <FontAwesomeIcon icon="users" /> See player pairings view
        </a>
        <button
          type="button"
          class="btn btn-info"
          data-toggle="modal"
          data-target="#faq"
        >
          <FontAwesomeIcon icon="question" /> FAQ
        </button>
      </div>
      {#if !showReportedPairings}
        <div class="alert alert-info mt-3">
          Reported scores are currently hidden on this page. This will not
          affect other users viewing this page.
        </div>
      {/if}
    {:else}
      <a
        href="/tournaments/{tournamentId}/players/meeting"
        class="btn btn-primary"
      >
        <FontAwesomeIcon icon="list-ul" /> Player meeting
      </a>
    {/if}
  {:else if data.policy.update}
    <button type="button" class="btn btn-success" onclick={addSwissStage}>
      <FontAwesomeIcon icon="plus" /> Add Swiss stage
    </button>
  {/if}
</div>

<!-- Tournament admin controls -->
<!-- TODO: Close registration button -->
<!-- TODO: Open registration button -->
<!-- TODO: Unlock all players button -->
<!-- TODO: Lock all players button -->
<!-- TODO: Pair new round button -->

<!-- Stages -->
{#each data.stages as stage, index (stage.format)}
  <Stage
    {stage}
    {tournamentId}
    startExpanded={index === data.stages.length - 1}
    {showReportedPairings}
  />
{/each}

<!-- FAQ dialog -->
<ModalDialog id="faq" headerText="FAQ">
  <p class="font-weight-bold">How does self reporting work?</p>
  <ul>
    <li>
      For self reporting, a player needs to be logged in with the NRDB account
      they used to register for the tournament to ensure they are reporting only
      their games.
    </li>
    <li>
      Self reporting in Cobra works alongside the <span class="font-weight-bold"
        >two-eye principle</span
      >: both players have to report the same result for Cobra to accept the
      answer and set the scores.
    </li>
  </ul>
  <p class="font-weight-bold">Does self reporting replace normal reports?</p>
  <p>
    No, it just allows players to report their own scores instead of handing in
    manually. This should ease the overall reporting process.
  </p>
  <ul>
    <li>
      The TO can monitor any reports by clicking on <span
        class="font-weight-bold">'Reports'</span
      > which shows the scores reported.
    </li>
    <li>
      The TO can accept a single report by clicking on the provided option.
    </li>
    <li>As always, the TO can report games as normal.</li>
  </ul>
</ModalDialog>
