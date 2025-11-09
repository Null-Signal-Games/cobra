<script lang="ts">
  import type { Identity } from "./Identity";

  let {
    identity,
    name_if_missing,
    icon_if_missing,
    points,
    include_icon = true,
    include_name = true,
    gray_out = false
  }: {
    identity: Identity | null,
    name_if_missing?: string,
    icon_if_missing?: string,
    points?: number,
    include_icon?: boolean,
    include_name?: boolean,
    gray_out?: boolean
  } = $props();
</script>

{#if identity && (identity.name || name_if_missing)}
  <div class={gray_out ? "" : identity.faction}>
    {#if include_icon}
      {#if identity.faction}
        <i class="fa icon icon-{identity.faction}"></i>
      {:else if icon_if_missing}
        <i class="fa icon icon-{icon_if_missing}"></i>
      {/if}
    {/if}

    {#if include_name}
      {#if identity.name}
        {identity.name}
      {:else}
        {name_if_missing}
      {/if}
      
      {#if points}
        ({points})
      {/if}
    {/if}
  </div>
{/if}
