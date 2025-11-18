<script lang="ts">
    import { globalMessages } from "./GlobalMessageState.svelte";
</script>

<div>
  {#each globalMessages.infos as info}
    {#if info}
      <div class="alert alert-info">{info}</div>
    {/if}
  {/each}

  {#each globalMessages.warnings as warning}
    {#if warning}
      <div class="alert alert-warning">{warning}</div>
    {/if}
  {/each}

  {#each globalMessages.errors as error}
    {#if error}
      <div class="alert alert-danger">{error}</div>
    {/if}
  {/each}
</div>
