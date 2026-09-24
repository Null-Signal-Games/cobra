<script lang="ts">
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { CardSearchOption } from "$lib/model/Deck";
  import type { Printing } from "$lib/utils/api_types";
  import { transformCardLookup } from "$lib/utils/decks.svelte";
  import Svelecte from "svelecte";
  import type { Snippet } from "svelte";

  let {
    sideId,
    allowEdit,
    isIdentity,
    onChange,
    children,
  }: {
    sideId: string;
    allowEdit: boolean;
    isIdentity: boolean;
    onChange: (printing: Printing) => void;
    children: Snippet;
  } = $props();

  let editing = $state(false);

  function getCardSearchUrl(sideId: string | null) {
    const searchString = `[query] ${isIdentity ? "t:identity" : "t!identity"}`;
    return `https://api.netrunnerdb.com/api/v3/public/printings?fields[printings]=card_id,card_type_id,title,side_id,faction_id,minimum_deck_size,influence_limit,influence_cost&filter[side_id]=${sideId}&filter[distinct_cards]=true&filter[search]=${searchString}`;
  }

  function sveleteOnChange(selection: CardSearchOption | null) {
    if (!selection?.value.id) {
      return;
    }

    onChange(selection.value);

    editing = false;
  }
</script>

<div class="d-flex">
  {#if editing}
    <Svelecte
      controlClass="form-control"
      placeholder="Enter identity name"
      fetch={getCardSearchUrl(sideId)}
      fetchCallback={transformCardLookup}
      labelField="label"
      valueField="value"
      onChange={sveleteOnChange}
    />
    <button
      type="button"
      title="Cancel"
      class="btn btn-link p-0 ml-2"
      onclick={() => (editing = false)}
    >
      <FontAwesomeIcon icon="close" />
    </button>
  {:else}
    <div class="w-100">
      {@render children()}
    </div>
    {#if allowEdit}
      <button
        type="button"
        title="Edit"
        class="btn btn-link p-0 ml-2"
        onclick={() => (editing = true)}
      >
        <FontAwesomeIcon icon="pencil" />
      </button>
    {/if}
  {/if}
</div>
