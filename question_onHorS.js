/*
for testing sign-in:  username: larryvolz/pw: $hsZacNat123

*/


$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $favoritedArticles = $("#favorited-articles");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.slideToggle(); //was originally toggle - but this looks cooler
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {  //NOTE: 2nd parameter filters to #nav-all (why not just select that)???
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");          //WORTH REMEMBERING!!!
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * an event listener to generate and add a story to the db, page and storiesList
   */
  //DONE: Event listener from menu to show the add story form
  $("#nav-submit").on("click",()=> $("#submit-form").show())


  // DONE: added event listener for new article form submission
  $("#add-story-btn").on("click", async function() {

    //DONE: Get story submission form info
    
    const storyObj = {
            author : $("#author").val(),
              title : $("#title").val(),
              url : $("#url").val()
              };
    
      let newStory = storyList.addStory(currentUser.username, storyObj)
      .then(function(newStory) {

        //DONE: make text and add it to dom
        const storyHtml = generateStoryHTML(newStory);
        $("#all-articles-list").prepend(storyHtml);
      })
    
  });

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    //DONE: ADD DEFAULT STAR HERE
    //TODO: If a favorite - make it fas fa-star class - possibly pass user in too for that
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <i class="far fa-star star"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    


    return storyMarkup;
  }

  /**
   * event listener to favorite/unfavorite a single article
   */

   //DONE: create event listener on article container 
   //DONE: then target closest li/star
   $allStoriesList.on('click', ".star", (evt)=> {

      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");

      //NOTE: HAVE TO WRAP EVENTS AS JQUERY OBJECT TO USE JQUERY METHODS!  evt.target won't work
      //must be wrapped $() so $(evt.target)

      //DONE: get star & unique story id from the li clicked on
      let $starLine = $(evt.target).closest("i");  //fontawesome is stored as <i class ="whatever"></i>
      $storyId = $(evt.target).closest("li").attr("id");

      // console.log("storyID: ", $storyId);
      console.log("faves: ", currentUser.favorites);

      //upadate currentUser.favorites:  checkIfLoggedIn()
      // currentUser = await function(token, username) {
      //   User.getLoggedInUser(token,username);
      // }

      // console.log(`User.getLoggedInUser returned: ${currentUser}`)

      //DONE: idList = extracted array of storyId's from array of favorite story objects for comparison
      let idList = currentUser.favorites.map(val =>{
        return val["storyId"];
      })
      console.log("Current Favorites", idList);

      //TODO: If ALREADY favorited - remove:
      //test
      let yes = idList.includes($storyId);
        console.log(`idList includes $storyId? ${yes}`)

      if (idList.includes($storyId)) {
        
        //TODO: API TO REMOVE from user/favorites
        let res = currentUser.removeFavorite(currentUser.username, $storyId, token)

        //TODO: Change solid star to open (fa-regular)
        $starLine.toggleClass("fas fa-star");
        $starLine.toggleClass("far fa-star");

        //TODO: Update the screen and currentUser.favorites (TODO: remember to fix generateHTML() )
        await checkIfLoggedIn();


      } else {  
          //NOT FAVORITED -> SO 
          //DONE: do API call currentUser to ADD this one to favorites
          let res = currentUser.addFavorite(currentUser.username, $storyId, token);
          // console.log(`ADDED: `, res);

          //DONE: change class to change the star to solid 
          $starLine.toggleClass("fas fa-star");
          $starLine.toggleClass("far fa-star");

          //TODO: Update the screen and currentUser.favorites (TODO: remember to fix generateHTML() )
          await checkIfLoggedIn();
      
      }
    });

  /**
   *  event listener to show favorites
   */

   //TODO: ADD event listener to nav-bar

   //TODO: call userFavorites() method to show favorites



  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();

    //DONE: ADDED NAME TO RIGHT SIDE OF NAVBAR LIKE TEACHER'S
    $navLogOut.text(currentUser.username+("(logout)")).css("fontSize", "small");
    //DONE: show main nav links like teacher's
    $(".main-nav-links").show();
    //DONE: Show name,username at bottom of page
    $("#profile-name").append(currentUser.name);
    $("#profile-username").append(currentUser.username);

    //DONE: Show created date at bottom of page.
    //OPT. TODO: re-format date to be more readable
    $("#profile-account-date").append(currentUser.createdAt);

  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});