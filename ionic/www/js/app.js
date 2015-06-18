// Ionic Angular Firechat App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'angularFirechat' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'angularFirechat.services' is found in services.js
// 'angularFirechat.controllers' is found in controllers.js
angular.module('angularFirechat', ['ionic', 'angularFirechat.controllers', 'angularFirechat.services', 'angularFirechat.filters', 'angularFirechat.directives'])

//------------------------------------------------------------------------------
//
//  Ionic platform setting
//
//------------------------------------------------------------------------------

.run(function($ionicPlatform) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });

})

.config(function($ionicConfigProvider) {

  $ionicConfigProvider.backButton.text('').previousTitleText(false);

})

//------------------------------------------------------------------------------
//
//  Route
//
//------------------------------------------------------------------------------

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('entry', {
      url: '/entry',
      templateUrl: 'templates/entry.html',
    })

    .state('main', {
      url: '',
      abstract: true,
      templateUrl: 'templates/main.html',
      controller: 'MainCtrl'
    })

    .state('main.home', {
      url: '/home',
      templateUrl: 'templates/main/home.html',
      controller: 'HomeCtrl'
    })

    .state('main.messages', {
      url: '/messages',
      templateUrl: 'templates/main/messages.html',
      controller: 'MessagesCtrl'
    })

    .state('main.room', {
      url: '/messages/room/:roomId',
      templateUrl: 'templates/main/messages/room.html',
      controller: 'RoomCtrl'
    })

    .state('main.settings', {
      url: '/settings',
      templateUrl: 'templates/main/settings.html',
      controller: 'SettingsCtrl'
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/entry');

})

//------------------------------------------------------------------------------
//
//  Authentication & Navigation helpers
//
//------------------------------------------------------------------------------

.run(function($rootScope, $state, $stateParams, $location, $ionicHistory, $ionicLoading, $ionicSideMenuDelegate, Auth, User) {

  // Show loading indicator untill authentication completed
  $ionicLoading.show();

  //--------------------------------------
  //  Authentication
  //--------------------------------------

  var isAuthCompleted = false;

  $rootScope.authData = null;
  $rootScope.currentUser = null;

  $rootScope.signInWithOAth = function(provider) {
    isAuthCompleted = false;
    $ionicLoading.show();

    Auth.$authWithOAuthRedirect(provider).then(function() {
      // User successfully logged in
    }).catch(function(error) {
      if (error.code === 'TRANSPORT_UNAVAILABLE') {
        $ionicLoading.hide();

        Auth.$authWithOAuthPopup(provider).then(function(authData) {
          // User successfully logged in.
          $ionicLoading.show();
        });
      } else {
        // Another error occurred
        console.log(error);
      }
    });
  };

  $rootScope.signOut = function() {
    Auth.$unauth();
    isAuthCompleted = false;
    $rootScope.authData = null;

    $rootScope.currentUser.$destroy();
    $rootScope.currentUser = null;

    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true,
      historyRoot: true
    });

    $state.go('entry');
  };

  var onAuthCompleted = function(authData) {
    $rootScope.authData = authData;

    if (authData === null) {
      console.info("Not joined yet");
      $ionicLoading.hide();
    } else {
      console.info("Joined as", authData.uid);
      // console.debug(authData);

      $rootScope.currentUser = User(authData.uid);

      $rootScope.currentUser.$loaded().then(function(data) {
        // console.debug(data);
        if(!data.name || !data.avatar) {
          switch (authData.provider) {
            case 'facebook':
              data.name = authData['facebook'].displayName;
              data.avatar = authData['facebook'].cachedUserProfile.picture.data.url;
              break;
            case 'twitter':
              data.name = authData['twitter'].displayName;
              data.avatar = authData['twitter'].cachedUserProfile.profile_image_url;
              break;
            case 'google':
              data.name = authData['google'].displayName;
              data.avatar = authData['google'].cachedUserProfile.picture;
              break;
            case 'github':
              data.name = authData['github'].displayName;
              data.avatar = authData['github'].cachedUserProfile.avatar_url;
              break;
          }

          data.$save();
        }

        $ionicLoading.hide();

        if($state.current.name === 'entry') {
          $location.path('/home');
        }
      });
    }
  };

  Auth.$onAuth(function(authData) {
    if(!isAuthCompleted) {
      // alert('Auth.$onAuth');
      onAuthCompleted(authData);
      isAuthCompleted = true;
    }
  });

  Auth.$waitForAuth().then(function(authData) {
    if(!isAuthCompleted) {
      // alert('Auth.$waitForAuth');
      onAuthCompleted(authData);
      isAuthCompleted = true;
    }
  });

  //--------------------------------------
  //  Navigation
  //--------------------------------------

  $rootScope.sideMenuDraggable = true;

  $rootScope.toggleSideMenu = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    // console.debug(toState);

    if(toState.name === 'entry') {
      if ($rootScope.authData !== null) {
        $location.path('/home');
      }
    } else {
      if ($rootScope.authData === null) {
        $location.path('/entry');
      }
    }

    if(toState.name === 'main.home') {
      $rootScope.sideMenuDraggable = false;
    } else {
      $rootScope.sideMenuDraggable = true;
    }
  });

  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    // console.debug($ionicHistory.viewHistory());
  });

});
