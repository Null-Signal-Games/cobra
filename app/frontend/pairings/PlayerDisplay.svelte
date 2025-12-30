<script lang="ts">
  import type { Pairing, PairingsContext, Player } from "./PairingsData";
  import Identity from "../identities/Identity.svelte";
  import { showIdentities } from "../utils/ShowIdentities";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import { getContext } from "svelte";

  let {
    player,
    pairing,
    left_or_right,
    is_single_sided,
    changePlayerSide,
  }: {
    player: Player;
    pairing: Pairing;
    left_or_right: string;
    is_single_sided: boolean;
    changePlayerSide: (player: Player, side: string) => void;
  } = $props();

  const pairingsContext: PairingsContext = getContext("pairingsContext");
</script>

{#snippet setSideButton(player: Player, side: string)}
  <button
    class="btn btn-sm mr-1 {player.side === side
      ? 'btn-dark'
      : 'btn-outline-dark'}"
    onclick={() => {
      changePlayerSide(player, side);
    }}
  >
    {#if player.side === side}
      <FontAwesomeIcon icon="check" />
    {/if}
    {side == "corp" ? "Corp" : "Runner"}
  </button>
{/snippet}

<div class="col-sm {left_or_right}_player_name">
  <!-- Name -->
  {player.name_with_pronouns}

  <!-- Side -->
  {#if is_single_sided && pairing.player1.id && pairing.player2.id}
    <br />
    {#if pairingsContext.showOrganizerView}
      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
      {@render setSideButton(player, "corp")}
      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
      {@render setSideButton(player, "runner")}
    {:else if player.side_label}
      {player.side_label}
    {/if}
  {/if}

  <!-- IDs -->
  <div class="ids" style={$showIdentities ? "display: block;" : ""}>
    {#if is_single_sided}
      <Identity
        identity={player.side == "corp" ? player.corp_id : player.runner_id}
        name_if_missing="Unspecified"
        icon_if_missing="interrupt"
      />
    {:else}
      <Identity
        identity={player.corp_id}
        name_if_missing="Unspecified"
        icon_if_missing="interrupt"
      />
      <Identity
        identity={player.runner_id}
        name_if_missing="Unspecified"
        icon_if_missing="interrupt"
      />
    {/if}
  </div>
</div>
