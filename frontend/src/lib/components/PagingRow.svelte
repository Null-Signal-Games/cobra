<script lang="ts">
	let {
		loading = false,
		canGoBack = false,
		canGoNext = false,
		onBack,
		onNext
	}: {
		loading?: boolean;
		canGoBack?: boolean;
		canGoNext?: boolean;
		onBack?: () => void | Promise<void>;
		onNext?: () => void | Promise<void>;
	} = $props();
</script>

<div class="row m-3">
	<div class="col-12 d-flex justify-content-between align-items-center">
		<button class="btn btn-primary" disabled={!canGoBack || loading} onclick={() => onBack?.()}>
			<i class="fa fa-arrow-left"></i> Back
		</button>
		<div class="text-muted">
			{#if loading}
				<i class="fa fa-spinner fa-spin"></i> Loading...
			{/if}
		</div>
		<button class="btn btn-primary" disabled={!canGoNext || loading} onclick={() => onNext?.()}>
			Next <i class="fa fa-arrow-right"></i>
		</button>
	</div>
</div>
