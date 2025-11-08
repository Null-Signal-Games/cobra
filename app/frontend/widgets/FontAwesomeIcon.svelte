<script lang="ts">
  interface Props{
    icon: string;
    cssClass?: string;
  }

  let { icon, cssClass }: Props = $props();
</script>

<i class="fa fa-{icon} {cssClass}"></i>
