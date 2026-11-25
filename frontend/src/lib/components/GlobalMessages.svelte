<script lang="ts">
	import { globalMessages } from '#lib/utils/GlobalMessageState.svelte.ts';
	import FontAwesomeIcon from './FontAwesomeIcon.svelte';

	function dismissMessage(messages: string[], index: number) {
		if (index >= messages.length) {
			return;
		}
		messages.splice(index, 1);
	}
</script>

<div class="global-messages">
	{#snippet messageList(messages: string[], alertClass: string)}
		{#each messages as msg, i (msg)}
			{#if msg}
				<div class="alert {alertClass} d-flex">
					{msg}
					<button
						type="button"
						class="btn btn-link align-self-start ml-auto p-0"
						onclick={() => {
							dismissMessage(messages, i);
						}}
					>
						<FontAwesomeIcon icon="xmark" cssClass={alertClass} />
					</button>
				</div>
			{/if}
		{/each}
	{/snippet}

	{@render messageList(globalMessages.infos, 'alert-info')}
	{@render messageList(globalMessages.warnings, 'alert-warning')}
	{@render messageList(globalMessages.errors, 'alert-danger')}
</div>

<style>
	.global-messages {
		position: sticky;
		top: calc(var(--nav-height) + 1rem);
		z-index: 1019; /* Make sure this is above everything except the nav bar menus. */
	}
</style>
