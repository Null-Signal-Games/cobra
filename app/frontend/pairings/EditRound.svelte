<script lang="ts">
  import { onMount } from "svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import Pairing from "./Pairing.svelte";
  import { type RoundData, loadRound } from "./RoundData";
  import { redirectRequest } from "../utils/network";
  import GlobalMessages from "../utils/GlobalMessages.svelte";

  let {
    tournamentId,
    roundId,
  }: {
    tournamentId: number;
    roundId: number;
  } = $props();

  let data: RoundData | undefined = $state();

  onMount(async () => {
    data = await loadRound(tournamentId, roundId);
  });

  function rePair(e: MouseEvent) {
    e.preventDefault();

    if (!data || !confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    void redirectRequest(
      `/tournaments/${tournamentId}/rounds/${data.round.id}/repair`,
      "PATCH",
      data.csrf_token,
    );
  }

  function complete(e: MouseEvent, completed: boolean) {
    e.preventDefault();

    if (!data) {
      return;
    }

    void redirectRequest(
      `/tournaments/${tournamentId}/rounds/${data.round.id}/complete`,
      "PATCH",
      data.csrf_token,
      { completed: completed },
    );
  }

  function deleteRound(e: MouseEvent) {
    e.preventDefault();

    if (!data || !confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    void redirectRequest(
      `/tournaments/${tournamentId}/rounds/${data.round.id}`,
      "DELETE",
      data.csrf_token,
    );
  }
</script>

<GlobalMessages />

{#if data}
  <div class="col-12">
    <h2>Round {data.round.number}</h2>

    <p>
      <a href="/tournaments/{tournamentId}/rounds" class="btn btn-primary">
        <FontAwesomeIcon icon="arrow-left" /> Back to pairings
      </a>

      <!-- Edit controls -->
      {#if data.policy?.update}
        <button class="btn btn-warning" onclick={rePair}>
          <FontAwesomeIcon icon="refresh" /> Re-pair
        </button>
        {#if data.round.completed}
          <button
            class="btn btn-warning"
            onclick={(e) => {
              complete(e, false);
            }}
          >
            <FontAwesomeIcon icon="backward" /> Uncomplete
          </button>
        {:else}
          <button
            class="btn btn-warning"
            onclick={(e) => {
              complete(e, true);
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
        <button class="btn btn-danger" onclick={deleteRound}>
          <FontAwesomeIcon icon="trash" /> Delete round
        </button>
      {/if}
    </p>

    <!-- Pairings -->
    {#each data.round.pairings as pairing (pairing.id)}
      <hr />
      <Pairing
        {tournamentId}
        tournament={data.tournament}
        {pairing}
        round={data.round}
        stage={data.stage}
        tournamentPolicies={data.policy}
        csrfToken={data.csrf_token}
      />
    {/each}
  </div>

  <h3 class="mt-2 col-12">Unpaired players</h3>
  <div class="col-12">
    {#if data.round.unpaired_players && data.round.unpaired_players.length !== 0}
      {#each data.round.unpaired_players as player (player.id)}
        {player.name}
        {#if player.active === false}
          (Dropped){/if}
      {/each}

      {#snippet playerSelect(id: string)}
        <select
          id={`pairing_${id}`}
          name={`pairing[${id}]`}
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
        action="/tournaments/{tournamentId}/rounds/{roundId}/pairings"
        method="POST"
        class="form-inline col-12"
      >
        <input
          type="hidden"
          name="authenticity_token"
          value={data.csrf_token}
        />
        <input
          id="pairing_table_number"
          name="pairing[table_number]"
          type="number"
          class="form-control"
          placeholder="Table number"
        />
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render playerSelect("player1_id")}
        {#if data.stage.is_single_sided}
          <select id="side" name="pairing[side]" class="form-control mx-2">
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
