<script lang="ts">
	import type { Snippet } from 'svelte';
	let { text = '', children }: { text?: string; children?: Snippet } = $props();

	let isShown = $state(false);
</script>

<span
	role="tooltip"
	class="d-inline-block position-relative"
	onmouseenter={() => (isShown = true)}
	onmouseleave={() => (isShown = false)}
	onfocusin={() => (isShown = true)}
	onfocusout={() => (isShown = false)}
>
	{@render children?.()}
	{#if isShown}
		<span
			class="position-absolute bg-dark text-white p-1 rounded mb-1 small"
			style="bottom: 100%; left: 50%; transform: translateX(-50%); z-index: 1000; width: max-content; max-width: 20rem;"
		>
			{text}
		</span>
	{/if}
</span>
