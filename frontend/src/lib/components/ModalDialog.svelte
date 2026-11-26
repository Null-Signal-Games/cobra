<script lang="ts">
	import type { Snippet } from 'svelte';
	import FontAwesomeIcon from './FontAwesomeIcon.svelte';

	let {
		id,
		headerText,
		dialogClass,
		children,
		footer
	}: {
		id: string;
		headerText: string;
		dialogClass?: string;
		children?: Snippet;
		footer?: Snippet;
	} = $props();

	let closeButton = $state<HTMLButtonElement | undefined>();

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}

	export function close() {
		closeButton?.click();
	}
</script>

<div {id} class="modal fade" role="dialog" tabindex="-1" use:portal>
	<div class="modal-dialog modal-dialog-centered {dialogClass}" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h4>{headerText}</h4>
				<button
					bind:this={closeButton}
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
