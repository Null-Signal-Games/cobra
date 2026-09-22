<script lang="ts">
  import type { PageProps } from "./$types";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  let { data }: PageProps = $props();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const cleanCode = (formData.get("shortcode") as string).trim().toUpperCase();
    if (cleanCode) {
      await goto(resolve(`/${cleanCode}`));
    }
  }
</script>

<div class="row py-3 main-content">
  <div class="col-12">
    <div class="massive text-center">
      {data.icon}
    </div>
  </div>

  <div class="col-12 mb-4">
    <div class="text-center">Couldn't find that tournament!</div>
  </div>

  <div class="col-12">
    <!-- Whenever data.code changes, the form and its input are recreated fresh -->
    {#key data.code}
      <form class="form-inline justify-content-center" onsubmit={handleSubmit}>
        <label for="tournament-shortcode" class="mx-2">Try again?</label>
        <input
          id="tournament-shortcode"
          type="text"
          name="shortcode"
          class="form-control mr-2"
          placeholder="SHRT"
          value={data.code.toUpperCase()}
        />
        <button type="submit" class="btn btn-primary mr-2">
          <i class="fa fa-arrow-right"></i>
          Go to tournament
        </button>
      </form>
    {/key}
  </div>
</div>
