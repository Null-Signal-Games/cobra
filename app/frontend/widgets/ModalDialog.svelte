<script lang="ts">
  import type { Snippet } from "svelte";
  import FontAwesomeIcon from "./FontAwesomeIcon.svelte";

  interface Props {
    id: string;
    headerText: string;
    children?: Snippet;
    footer?: Snippet;
  }

  let { id, headerText, children, footer }: Props = $props();
</script>

<div {id} class="modal fade" role="dialog" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h4>{headerText}</h4>
        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close"
        >
          <FontAwesomeIcon icon="times" />
        </button>
      </div>

      <div class="modal-body">
        {@render children?.()}
      </div>

      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
</div>
