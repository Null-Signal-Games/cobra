<script lang="ts">
  import type { Player } from "./PairingsData";
  import Identity from "../identities/Identity.svelte";
  import { showIdentities } from "./ShowIdentities";

  let {
    player,
    left_or_right
  }: {
    player: Player,
    left_or_right: string
  } = $props();
</script>

<div class="col-sm {left_or_right}_player_name">
  {player.name_with_pronouns}
  {#if player.side_label}
    {player.side_label}
  {/if}
  <div class="ids" style={$showIdentities ? "display: block;" : ""}>
    {#if player.side_label}
      <Identity
        identity={player.side == "corp" ? player.corp_id : player.runner_id}
        name_if_missing="Unspecified"
        icon_if_missing="interrupt"
      />
    {:else}
      <Identity
        identity={player.corp_id}
        name_if_missing="Unspecified"
        icon_if_missing="interrupt" />
      <Identity
        identity={player.runner_id}
        name_if_missing="Unspecified"
        icon_if_missing="interrupt" />
    {/if}
  </div>
</div>
