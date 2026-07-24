<script lang="ts">
  let {
    icon,
    cssClass,
    dataTestId,
  }: {
    icon: string;
    cssClass?: string;
    dataTestId?: string;
  } = $props();
</script>

<i class="fa fa-{icon} {cssClass}" data-testid={dataTestId}></i>
