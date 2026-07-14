<script lang="ts">
	import "$lib/assets/css/application.scss";
	import favicon from "$lib/assets/favicon.ico";
	import { resolve } from "$app/paths";
	import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<title>Cobra</title>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous" />
	<link rel="stylesheet" href="../../node_modules/@fortawesome/fontawesome-free/css/all.min.css" />
</svelte:head>

<nav class="navbar navbar-expand-lg fixed-top navbar-dark dontprint">
  <div class="container">
    <a href={resolve("/")} class="navbar-brand">Cobra (BETA)</a>
		<ul class="navbar-nav ml-auto">
			<li class="nav-item">
				<a href={resolve("/")} class="nav-link text-light">
				  <FontAwesomeIcon icon="flask" />
				  Switch to classic
				</a>
			</li>
			<li class="nav-item">
				<a href={resolve("/")} class="nav-link text-light">
				  <FontAwesomeIcon icon="life-ring" />
				  How to
				</a>
			</li>
			<li class="nav-item dropdown">
				<a href="#" id="tournamentTypeDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="nav-link dropdown-toggle text-light">
				  <FontAwesomeIcon icon="trophy" />
				  Tournament types
				</a>
				<!-- TODO: Menu -->
			</li>
			<li class="nav-item dropdown">
				<a href="#" id="userDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="nav-link dropdown-toggle text-light">
				  <FontAwesomeIcon icon="user" />
				  Sign in
				</a>
				<!-- TODO: Menu -->
			</li>
		</ul>
  </div>
</nav>

<div class="container">
  {@render children()}
</div>

<div class="footer dontprint">
	<div class="container">
		<div class="row">
			<div class="col-3 nav-item">
				<a href="https://ko-fi.com/nullsignalgames">Support NSG on Ko-fi</a>
			</div>
			<div class="col-6 nav-item text-center">
				🐍 Maintained by <a href="https://nullsignal.games">Null Signal Games</a>. Created by Johno. 🐍
			</div>
			<div class="col-3 nav-item">
				<a href="https://docs.google.com/forms/d/e/1FAIpQLSdP_q1BqJbct1agLHBK-TdW08vEMeb8IRS1m9XofQMS6EUZnA/viewform" target="_blank" rel="noopener nofollow" class="text-muted ml-3">Report an issue</a>
			</div>
		</div>
	</div>
</div>
