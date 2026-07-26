<script lang="ts">
  import FontAwesomeIcon from "./FontAwesomeIcon.svelte";
</script>

<div class="col-3">
  <div class="sticky-top navbar navbar-light" id="help_contents">
    <nav class="nav nav-pills flex-column">
      <a class="nav-link" href="#help_login">Log In</a>
      <a class="nav-link" href="#help_create">Create a Tournament</a>
      <nav class="nav nav-pills flex-column">
        <a class="nav-link ml-3" href="#help_shortcode">What's a shortcode?</a>
      </nav>
      <a class="nav-link" href="#help_register">Register Players</a>
      <nav class="nav nav-pills flex-column">
        <a class="nav-link ml-3" href="#help_otherplayers"
          >Can players see other players when I register them?</a
        >
        <a class="nav-link ml-3" href="#help_playermeeting">What is the "Player Meeting"?</a>
      </nav>
      <a class="nav-link" href="#help_rounds">Create Rounds and Pairings</a>
      <a class="nav-link" href="#help_results">Enter Results</a>
      <nav class="nav nav-pills flex-column">
        <a class="nav-link ml-3" href="#help_completing"> What is "Completing" a round? </a>
      </nav>
      <a class="nav-link" href="#help_editround"> Something Went Wrong! </a>
      <a class="nav-link" href="#help_standings"> Standings </a>
      <a class="nav-link" href="#help_settings">Settings</a>
      <nav class="nav nav-pills flex-column">
        <a class="nav-link ml-3" href="#help_abr"> What is "Upload to Always Be Running?" </a>
        <a class="nav-link ml-3" href="#help_cut"> What is "Cut to Top X"? </a>
      </nav>
    </nav>
  </div>
</div>

<div class="col-9 help_targets">
  <h1>How to use Cobra</h1>
  <p>Use Cobra to run your tournament!</p>

  <hr class="my-4" />

  <h2 id="help_login">Log In</h2>
  <p>Click on "Sign in as TO" in the top bar to use NetrunnerDB to log in.</p>

  <div class="alert alert-warning">
    <FontAwesomeIcon icon="warning" /> Cobra uses NRDB to identify you but will not manipulate your decks
    in any way.
  </div>

  <hr class="my-4" />

  <h2 id="help_create">Create a Tournament</h2>
  <p>
    To create a tournament, click "Create tournament" in the header. Enter your tournament's name
    and change the settings if necessary, then click "Create".
  </p>

  <h4 id="help_shortcode">What's a "shortcode"?</h4>
  <p>The tournament page displays a shortcode which you can share with players.</p>
  <p>
    They will be able to enter the shortcode on the homepage, or go straight to the short URL, to
    see pairings and standings for your tournament.
  </p>

  <div class="alert alert-info">
    <FontAwesomeIcon icon="qrcode" /> A printable QR code is available, to let players quickly read the
    tournament's short URL.
  </div>

  <hr class="my-4" />

  <h2 id="help_register">Register Players</h2>
  <p>
    On the tournament page is the player management area, visible only to the TO. Enter a name and
    optional identity info and click "Create". You can also assign players a first-round bye here.
  </p>

  <div class="alert alert-info">
    <FontAwesomeIcon icon="magic" /> The identity fields will auto-complete. If you fill these correctly,
    the data will transfer correctly to Always Be Running.
  </div>

  <p>
    Once you've created players, you can modify them on this page (make sure to click "Save" on the
    correct row.)
  </p>
  <p>
    You can "Drop" players to automatically exclude them from future round pairings, but keep them
    in the standings and apply SOS from them, etc. You can "Reinstate" players if you dropped them
    in error, or would like to include them in pairings again for some reason.
  </p>

  <div class="alert alert-danger">
    <FontAwesomeIcon icon="warning" /> You can "Delete" players, but be careful! This will delete them
    from the standings,
    <strong>AND ALSO DELETE ALL PAIRINGS THEY WERE INVOLVED IN.</strong>
    Only use this feature for an incorrect registration. If you need to remove a player from future pairings,
    "Drop" them instead.
  </div>

  <h4 id="help_otherplayers">Can players see other players when I register them?</h4>
  <p>
    Players cannot see the player management on this page, only the shortcode/URL and ID breakdown
  </p>
  <p>
    In addition, the ID breakdown and standings (which contains player and ID information) will only
    become visible once the first round has been paired. Players cannot gain an advantage by knowing
    which identities other players are registering with.
  </p>

  <h4 id="help_playermeeting">What is the "Player Meeting"?</h4>
  <p>
    Player meetings are used in particular in very large tournaments to finalise registration. All
    players are paired alphabetically to ensure that registration was correct (no one missed, no one
    registered twice etc). No game is played with these pairings, and it does not affect standings
    in any way.
  </p>

  <hr class="my-4" />

  <h2 id="help_rounds">Create Rounds and Pairings</h2>

  <p>
    Use the "Pairings" tab on your tournament page to manage the tournament after registration is
    complete. Click "Pair new round!" to create a new round and automatically pair off all players.
  </p>
  <p>
    "Pairings by name" provides clear printable pairings. These pairings list all pairings twice
    (once flipped), so players can scan down the alphabetical left hand column for their name to
    easily find their pairing. Players can view this page online as well.
  </p>
  <p>"Match slips" provides you with printable match slips you can cut out and distribute.</p>

  <div class="alert alert-info">
    <FontAwesomeIcon icon="magic" /> The "Collate" option will collate the slips so that you can slice
    all the pages in one stack and they will already be sorted by table number.
  </div>

  <hr class="my-4" />

  <h2 id="help_results">Enter Results</h2>

  <p>
    You can enter a result for a pairing and quickly enter 6-0, 3-3 or 0-6 results by clicking the
    appropriate button. For other results, click "..." to reveal two fields to enter a manual score,
    then click "Save".
  </p>

  <div class="alert alert-warning">
    <FontAwesomeIcon icon="frown-o" /> At this time, Cobra does not differentiate between Runner splits
    and Corporation splits, or handle game-level results. Sorry.
  </div>

  <p>Once a result has been entered, you can edit it; don't forget to click "Save" again.</p>

  <h4 id="help_completing">What is "Completing" a round?</h4>
  <p>
    Results intentionally do not update the standings as they come in. To allow them to apply to the
    standings, you must "Complete" the round. This simply indicates that the standings should
    include this round's results.
  </p>

  <div class="alert alert-warning">
    <FontAwesomeIcon icon="hand-stop-o" /> You will not be able to create a new round until the previous
    round has been "Completed"
  </div>

  <div class="alert alert-danger">
    <FontAwesomeIcon icon="warning" /> You can edit results from previous rounds at any time! This will
    update the standings, but will not affect previous rounds' pairings. It will affect any future pairings
    you create.
  </div>

  <hr class="my-4" />

  <h2 id="help_editround">Something Went Wrong!</h2>
  <p>If you have a problem at some point, you may be able to resolve by "Editing" the round.</p>
  <p>
    You can click "Delete round" on this page to delete the round AND ALL ASSOCIATED PAIRINGS. No
    players will be affected, but obviously the standings could well be affected by removing
    results.
  </p>
  <p>
    You can "Uncomplete" a round if you erroneously marked it as complete. Remember, this will hide
    the round's results from the standings.
  </p>
  <p>
    You can "Re-pair" the round. This will delete ALL pairings in this round (the result data for
    the round, if any, will be lost, so be careful!) and recalculate pairings again. This may be
    useful if you had to edit a misreported result from the previous round.
  </p>
  <p>
    You can also use this page to manually edit the pairings. Delete the pairings that are incorrect
    by clicking the bin/trash button on that row. Then a list of "Unpaired players" will be
    displayed, and a "Create pairing" form will appear. You can create pairings with any unpaired
    players (including dropped players if necessary) and also byes.
  </p>
  <p>
    For Single-Sided rounds, you will need to set the sides for the players after making the pairing
    with the "Corp" and "Runner" buttons.
  </p>

  <hr class="my-4" />

  <h2 id="help_standings">Standings</h2>

  <p>
    The "Standings" tab displays the current standings, based on all pairings from completed rounds,
    and is visible to the public online.
  </p>

  <hr class="my-4" />

  <h2 id="help_settings">Settings</h2>

  <p>
    In the "Settings" tab, which only you can see, you can rename the tournament and change some
    details, such as the date.
  </p>

  <div class="alert alert-info">
    <FontAwesomeIcon icon="calendar" /> The homepage of the site will display all events taking place
    today to make it easier for your players to find.
  </div>
  <p>
    You can also amend how table numbers are assigned. By default, they are "random", which means
    that while players will be paired correctly, they will be assigned random table numbers, and
    good players will be distributed around the room. If you set this setting to "ranked", the
    better pairings will take place on higher tables, so the best players will be on tables 1, 2
    etc.
  </p>
  <p>
    Finally, you can set your tournament to "Private" so that only you can access it, and it will
    not be publicly listed anywhere.
  </p>

  <div class="alert alert-warning">
    <FontAwesomeIcon icon="warning" /> Make sure to note down your tournament's shortcode before marking
    it as "Private" or you won't be able to find it!
  </div>

  <h4 id="help_abr">What is "Upload to Always Be Running?"</h4>
  <p>
    Always Be Running is a tournament results aggregator, and results from your tournament on Cobra
    can be uploaded directly to it!
  </p>
  <p>
    Click "Upload to Always Be Running" and you will receive a short upload code which you can enter
    in ABR when concluding the tournament there. The standings and identities will pull through.
  </p>

  <div class="alert alert-info">
    <FontAwesomeIcon icon="upload" /> Choose the "Conclude with NRTM code" option when importing Cobra
    tournaments into ABR; Cobra uses NRTM's upload process.
  </div>

  <p>
    You can also download the standings as JSON. Cobra uses NRTM's tournament JSON format. This JSON
    can be uploaded to Always Be Running, for instance.
  </p>

  <h4 id="help_cut">What is "Cut to Top X"?</h4>
  <p>
    You can cut to a double elimination bracket in your tournament. Currently only top 4 and top 8
    are supported. This will create a new stage in your tournament with only the top N (non-dropped)
    players from the standings, and this new stage will pair all rounds following the correct
    bracket structure, rather than using Swiss pairings.
  </p>
  <p>
    In a double elimination bracket, it's important to mark the pairings in the first round to
    indicate which side each player played. In subsequent rounds, Cobra will determine which side
    each player should play, randomising if necessary as well.
  </p>
</div>
