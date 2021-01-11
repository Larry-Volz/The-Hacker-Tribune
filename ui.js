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
  const $userProfile = $("#user-profile");

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

  function generateStoryHTML(story, myStory) {
    let hostName = getHostName(story.url);

    //DONE: If a favorite - make it fas fa-star class - possibly pass user in too for that
    let starClass = isFavorite(story) ? "fas" : "far";

    // render a trash can for deleting your own story
    const trashCanFont = myStory
    ? `<span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`
    : "";

    // render story markup
    // render a trash can for deleting your own story if isOwnStory (teachers line 332)
    //DONE: ADD DEFAULT STAR HERE
    const storyMarkup = $(`
      <li id="${story.storyId}">
      ${trashCanFont}
      <i class="${starClass} fa-star star"></i>
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
   $("body").on('click', ".star", (evt)=> {

      //NOTE: HAVE TO WRAP EVENTS AS JQUERY OBJECT TO USE JQUERY METHODS!  evt.target won't work
      //must be wrapped $() so $(evt.target)

      //DONE: get star & unique storyId from the li clicked on
      let $starLine = $(evt.target).closest("i");  //fontawesome is stored as <i class ="whatever"></i>
      $storyId = $(evt.target).closest("li").attr("id");

      if ($(evt.target).hasClass("fas")){
        
        //DONE: API TO REMOVE from user/favorites
        let res = currentUser.removeFavorite(currentUser.username, $storyId);

        //DONE: Change solid star to open (fas to far)
        $starLine.toggleClass("fas far");

      } else {  
          //NOT FAVORITED -> SO 
          //DONE: do API call currentUser to ADD this one to favorites
          let res = currentUser.addFavorite(currentUser.username, $storyId);

          //DONE: Change open star to solid (far to fas)
          $starLine.toggleClass("fas far");
      
      }
    });

  /**
   *  event listener to show favorites
   */

   //TODO: ADD event listener to nav-bar
   $("body").on("click", "#nav-my-favorites", function(){

    if (currentUser){
    //TODO: call showFavorites() method to show favorites
      showFavorites();
      //turn on that div
      $favoritedArticles.show();
    }
   });





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

   //DONE: turn code at ui.js line 243 into a reusable method
   function isFavorite(story) {
    let faves = new Set();
    if(currentUser){
      faves = new Set(currentUser.favorites.map(obj => obj.storyId));
    }
    return faves.has(story.storyId);
  }

  function hideAll() {
    const elements = [
      $allStoriesList,
      $createAccountForm,
      $favoritedArticles,
      $filteredArticles,
      $loginForm,
      $ownStories,
      $submitForm,
      $userProfile 
    ];
    elements.forEach($itm => $itm.hide());
  }

  function showFavorites(){
    
      //DONE: hide all the different div display elements
      hideAll();

      //DONE: clear out any list items in $favoritedArticles
      $favoritedArticles.empty();
      
      if (currentUser.favorites.length === 0){
        $favoritedArticles.append("<h4>You have not favorited any articles yet</h4>");

      } else {
                
        //get each article and add them to the dom
        for (let ea of currentUser.favorites) {
          let faveHTML = generateStoryHTML(ea, false);
          $favoritedArticles.append(faveHTML)
        }

        //return

      }
  }
  
});
