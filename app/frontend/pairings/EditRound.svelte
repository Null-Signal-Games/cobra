<script lang="ts">
  import { onMount, setContext } from "svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import { type RoundData, loadRound } from "./RoundData";
  import { csrfToken, redirectRequest } from "../utils/network";
  import GlobalMessages from "../widgets/GlobalMessages.svelte";
  import Pairing from "./Pairing.svelte";
  import { deletePairing } from "./PairingsData";

  let {
    tournamentId,
    roundId,
  }: {
    tournamentId: number;
    roundId: number;
  } = $props();

  let data: RoundData | undefined = $state();

  setContext("pairingsContext", { showOrganizerView: true });

  onMount(async () => {
    data = await loadRound(tournamentId, roundId);
  });

  function rePair() {
    if (!data || !confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    void redirectRequest(
      `/beta/tournaments/${tournamentId}/rounds/${data.round.id}/repair`,
      "PATCH",
    );
  }

  function complete(completed: boolean) {
    if (!data) {
      return;
    }

    void redirectRequest(
      `/beta/tournaments/${tournamentId}/rounds/${data.round.id}/complete`,
      "PATCH",
      { completed: completed },
    );
  }

  function deleteRound() {
    if (!data || !confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    void redirectRequest(
      `/beta/tournaments/${tournamentId}/rounds/${data.round.id}`,
      "DELETE",
    );
  }

  async function deletePairingCallback(pairingId: number) {
    if (!data || !confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await deletePairing(tournamentId, roundId, pairingId);
    if (!success) {
      return;
    }

    data = await loadRound(tournamentId, roundId);
  }
</script>

<GlobalMessages />

{#if data}
  <div class="col-12">
    <h2>Round {data.round.number}</h2>

    <p>
      <a href="/beta/tournaments/{tournamentId}/rounds" class="btn btn-primary">
        <FontAwesomeIcon icon="arrow-left" /> Back to pairings
      </a>

      <!-- Edit controls -->
      {#if data.policy?.update}
        <button type="button" class="btn btn-warning" onclick={rePair}>
          <FontAwesomeIcon icon="refresh" /> Re-pair
        </button>
        {#if data.round.completed}
          <button
            type="button"
            class="btn btn-warning"
            onclick={() => {
              complete(false);
            }}
          >
            <FontAwesomeIcon icon="backward" /> Uncomplete
          </button>
        {:else}
          <button
            type="button"
            class="btn btn-warning"
            onclick={() => {
              complete(true);
            }}
          >
            <FontAwesomeIcon icon="check" /> Complete
          </button>
        {/if}
        <a
          href={`/tournaments/${tournamentId}/rounds/${roundId}/edit`}
          class="btn btn-warning"
        >
          <FontAwesomeIcon icon="wrench" /> Advanced
        </a>
        <button type="button" class="btn btn-danger" onclick={deleteRound}>
          <FontAwesomeIcon icon="trash" /> Delete round
        </button>
      {/if}
    </p>

    <!-- Pairings -->
    {#each data.round.pairings as pairing (pairing.id)}
      <hr />
      <Pairing
        tournament={data.tournament}
        {pairing}
        round={data.round}
        stage={data.stage}
        deleteCallback={deletePairingCallback}
      />
    {/each}
    <hr />
  </div>

  <h3 class="mt-2 col-12">Unpaired players</h3>
  <div class="col-12">
    {#if data.round.unpaired_players && data.round.unpaired_players.length !== 0}
      {#each data.round.unpaired_players as player (player.id)}
        <div>
          {player.name}
          {#if player.active === false}
            (Dropped)
          {/if}
        </div>
      {/each}

      {#snippet playerSelect(id: string)}
        <select
          id={`pairing_${id}`}
          name={`pairing[${id}]`}
          aria-label={`New pairing ${id}`}
          class="form-control mx-2"
        >
          <option value="">(Bye)</option>
          {#each data?.round.unpaired_players as player (player.id)}
            <option value={player.id}>{player.name}</option>
          {/each}
        </select>
      {/snippet}

      <h3 class="mt-2">Create pairing</h3>
      <form
        id="new_pairing"
        action="/beta/tournaments/{tournamentId}/rounds/{roundId}/pairings"
        method="POST"
        class="form-inline col-12"
      >
        <input type="hidden" name="authenticity_token" value={csrfToken()} />
        <input
          id="pairing_table_number"
          name="pairing[table_number]"
          aria-label="New pairing table number"
          type="number"
          class="form-control"
          placeholder="Table number"
        />
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render playerSelect("player1_id")}
        {#if data.stage.is_single_sided}
          <select
            id="side"
            name="pairing[side]"
            aria-label="New pairing player 1 side"
            class="form-control mx-2"
          >
            <option value="">Player 1 Side</option>
            <option value="player1_is_corp">Corp</option>
            <option value="player1_is_runner">Runner</option>
          </select>
        {/if}
        vs
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render playerSelect("player2_id")}
        <button type="submit" class="btn btn-success">
          <FontAwesomeIcon icon="plus" /> Create
        </button>
      </form>
    {:else}
      None
    {/if}
  </div>
{:else}
  <div class="d-flex align-items-center m-2">
    <div class="spinner-border m-auto"></div>
  </div>
{/if}
