<script lang="ts">
  import { type Pairing } from "#lib/model/Pairing.ts";
  import type { Player } from "#lib/model/Player.ts";
  import Identity from "./identity/Identity.svelte";
  import { showIdentities } from "#lib/utils/ShowIdentities.ts";

  let {
    player,
    pairing,
    left_or_right,
    is_single_sided,
    show_ids = true,
  }: {
    player: Player;
    pairing?: Pairing;
    left_or_right: string;
    is_single_sided: boolean;
    show_ids?: boolean;
  } = $props();
</script>

<div class="{left_or_right}_player_name">
  <!-- Name -->
  {player.name_with_pronouns}

  <!-- Side -->
  {#if is_single_sided && pairing?.player1.id && pairing.player2.id}
    <br />
    {player.side_label}
  {/if}

	<!-- IDs -->
	{#if show_ids}
		<div class="ids" style={$showIdentities ? 'display: block;' : 'display: none;'}>
			{#if is_single_sided}
				<Identity
					identity={player.side == 'corp' ? player.corp_id : player.runner_id}
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
	{/if}
</div>

<style>
  .left_player_name {
    text-align: right;
  }

  .right_player_name {
    text-align: left;
  }
</style>
