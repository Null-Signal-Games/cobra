<script lang="ts">
  import "$lib/assets/css/pairings.sass";
  import Stage from "./Stage.svelte";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ModalDialog from "$lib/components/ModalDialog.svelte";
  import type { ScoreReport } from "$lib/model/ScoreReport";
  import { resolve } from "$app/paths";
  import type { PageProps } from "./$types";
  import { showIdentities } from "$lib/utils/ShowIdentities";

  let { data, params }: PageProps = $props();

  let forcePlayerView = $state(false);

  function toggleForcePlayerView() {
    forcePlayerView = !forcePlayerView;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function reportScoreCallback(roundId: number, pairingId: number, report: ScoreReport, selfReport: boolean) {
    // TODO: Implement
  }
</script>

<div class="col-12">
  <GlobalMessages />
  
  <p></p>
  
  {#if data.stages.length > 0}
    <!-- Upper controls -->
    <div>
      {#if data.stages.every((s) => s.rounds.length === 0)}
        <a
          href={resolve(`/tournaments/${params.tournamentId}/players/meeting?back_to=view_pairings`)}
          class="btn btn-primary"
        >
          <FontAwesomeIcon icon="list-ul" /> Player meeting
        </a>
      {:else}
        <button
          type="button"
          class="btn btn-primary"
          onclick={() => {
            showIdentities.update((value) => !value);
          }}
        >
          <FontAwesomeIcon icon="eye-slash" /> Show/hide identities
        </button>
        <button
          type="button"
          class="btn btn-info"
          data-toggle="modal"
          data-target="#faq"
        >
          <FontAwesomeIcon icon="question" /> FAQ
        </button>
        {#if data.policy.update}
          <button
            type="button"
            class="btn btn-primary float-right"
            onclick={toggleForcePlayerView}
          >
            <FontAwesomeIcon icon="user" /> See organizer pairings view
          </button>
        {/if}
      {/if}
    </div>
  
    <!-- Stages -->
    <div class="mt-3">
      {#each data.stages as stage, index (stage.format)}
        <Stage
          {stage}
          startExpanded={index === data.stages.length - 1}
          tournament={data.tournamentData.tournament}
          {reportScoreCallback}
        />
      {/each}
    </div>
  
    <!-- FAQ dialog -->
    <ModalDialog id="faq" headerText="FAQ">
      <h5>How does self reporting work?</h5>
      <ul>
        <li>
          For self reporting, a player needs to be logged in with the NRDB
          account they used to register for the tournament to ensure they are
          reporting only their games.
        </li>
        <li>
          Self reporting in Cobra works alongside the
          <span class="font-weight-bold">two-eye principle</span>: both players
          have to report the same result for Cobra to accept the answer and set
          the scores.
        </li>
      </ul>
      <h5>Does self reporting replace normal reports?</h5>
      <p>
        No, it just allows players to report their own scores instead of handing
        in manually. This should ease the overall reporting process.
      </p>
      <ul>
        <li>
          The TO can monitor any reports by clicking on
          <span class="font-weight-bold">'Reports'</span>
          which shows the scores reported.
        </li>
        <li>
          The TO can accept a single report by clicking on the provided option.
        </li>
        <li>As always, the TO can report games as normal.</li>
      </ul>
    </ModalDialog>
  {/if}
</div>
