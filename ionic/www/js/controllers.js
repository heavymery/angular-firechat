angular.module('angularFirechat.controllers', [])

//------------------------------------------------------------------------------
//
//  Main controller
//
//------------------------------------------------------------------------------

.controller('MainCtrl', function($scope) {})

//------------------------------------------------------------------------------
//
//  Home controller
//
//------------------------------------------------------------------------------

.controller('HomeCtrl', function($scope) {})

//------------------------------------------------------------------------------
//
//  Messages controller
//
//------------------------------------------------------------------------------

.controller('MessagesCtrl', function($rootScope, $scope, $filter, $window, $timeout, $ionicModal, $ionicLoading, User, Users, Room, Rooms, Messages) {

  $scope.$watch('currentUser', function(newValue, oldValue) {
    $scope.rooms = {};

    if(!newValue) return;

    $scope.currentUser.$loaded().then(function(data) {
      // Initialize room list
      angular.forEach(data.rooms, function(value, key) {
        if(value) {
          if(!$scope.rooms[key]) {
            $scope.rooms[key] = Room(key);
          }
        }
      });

      // Update room list
      $scope.currentUser.$watch(function(event) {
        // Added
        angular.forEach($scope.currentUser.rooms, function(value, key) {
          if(value) {
            if(!$scope.rooms[key]) {
              $scope.rooms[key] = Room(key);
            }
          }
        });

        // Removed
        angular.forEach($scope.rooms, function(value, key) {
          if(!$scope.currentUser.rooms || !$scope.currentUser.rooms[key]) {
            $scope.rooms[key].$destroy();
            delete $scope.rooms[key];
          }
        });
      });
    });
  });

  //--------------------------------------
  //  New Message modal
  //--------------------------------------

  $scope.newMessage = {
    'to': [],
    'subject': '',
    'content': ''
  };

  $ionicModal.fromTemplateUrl('new-message-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.newMessageModal = modal;
  });

  $scope.sendMessage = function() {
    $ionicLoading.show();
    $scope.newMessageModal.hide();

    var members = {};
    members[$scope.currentUser.$id] = true;
    angular.forEach($scope.newMessage.to, function(value) {
      members[value.$id] = true;
    });

    Rooms.$add({
      'members': members,
      'subject': $scope.newMessage.subject,
      'timestamp': $window.Firebase.ServerValue.TIMESTAMP
    }).then(function(ref) {
      var roomId = ref.key();

      Messages(roomId).$add({
        'from': $scope.currentUser.$id,
        'content': $scope.newMessage.content,
        'timestamp': $window.Firebase.ServerValue.TIMESTAMP
      }).then(function(){
        angular.forEach(members, function(value, key) {
          User(key).$loaded().then(function(data) {
            if(!data.rooms) data.rooms = {};
            data.rooms[roomId] = true;
            data.$save();
          });
        });

        angular.forEach($scope.users, function(user) {
          user.selected = false;
        });

        $scope.newMessage.to = null;
        $scope.newMessage.subject = '';
        $scope.newMessage.content = '';

        $ionicLoading.hide();
      });
    });
  };

  $scope.cancelSendMessage = function() {
    angular.forEach($scope.users, function(user) {
      user.selected = false;
    });

    $scope.newMessage.to = null;
    $scope.newMessage.subject = '';
    $scope.newMessage.content = '';

    $scope.newMessageModal.hide();
  };

  //--------------------------------------
  //  Users modal
  //--------------------------------------

  $scope.users = Users;

  $ionicModal.fromTemplateUrl('users-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.usersModal = modal;
  });

  $scope.cancelSelectUsers = function () {
    angular.forEach($scope.users, function(user) {
      user.selected = false;
    });

    $scope.newMessage.to = null;

    $scope.usersModal.hide();

  };

  $scope.doneSeletUsers = function() {
    $scope.newMessage.to = $filter('filter')($scope.users, { 'selected': true }, true);

    $scope.usersModal.hide();
  };

  // Cleanup the modals & popover when view destroyed
  $scope.$on('$destroy', function() {
    $scope.newMessageModal.remove();
    $scope.usersModal.remove();
  });

})

//------------------------------------------------------------------------------
//
//  Room controller
//
//------------------------------------------------------------------------------

.controller('RoomCtrl', function ($rootScope, $scope, $state, $stateParams, $filter, $window, $timeout, $ionicPopover, $ionicPopup, $ionicModal, $ionicScrollDelegate, $ionicLoading, User, Users, Room, Message, Messages) {

  // Show loading indicator untill all message loaded
  $ionicLoading.show();

  $scope.room = Room($stateParams.roomId);
  $scope.messages = Messages($stateParams.roomId);
  $scope.members = {};

  $scope.room.$loaded().then(function(data) {
    angular.forEach(data.members, function(value, key) {
      if(value) {
        if(!$scope.members[key]) {
          $scope.members[key] = User(key);
        }
      }
    });

    $scope.room.$watch(function(event) {
      angular.forEach($scope.room.members, function(value, key) {
        if(value) {
          if(!$scope.members[key]) {
            $scope.members[key] = User(key);
          }
        }
      })
    });
  });

  $scope.messages.$loaded().then(function(data) {

    // For removed user
    angular.forEach(data, function(value, key) {
      if(!$scope.members[value.from]) {
        $scope.members[value.from] = User(value.from);
      }
    });

    $timeout(function() {
      $ionicScrollDelegate.scrollBottom(true);
    }, 300);

    $ionicLoading.hide();

    $scope.messages.$watch(function(event) {
      if(Math.abs($ionicScrollDelegate.getScrollView().getScrollMax().top - $ionicScrollDelegate.getScrollPosition().top) < 10) {
        $ionicScrollDelegate.scrollBottom(true);
      }
    });
  });

  //--------------------------------------
  //  Reply message
  //--------------------------------------

  $scope.replyMessage = {
    content: ''
  };

  $scope.sendReplyMessage = function() {
    $scope.messages.$add({
      'from': $scope.currentUser.$id,
      'content': $scope.replyMessage.content,
      'timestamp': $window.Firebase.ServerValue.TIMESTAMP
    }).then(function() {
      $scope.room.timestamp = $window.Firebase.ServerValue.TIMESTAMP;
      $scope.room.$save();

      $ionicScrollDelegate.scrollBottom(true);
    });

    $scope.replyMessage.content = '';

    var messageList = document.getElementById('messageList').getElementsByClassName('list')[0];
    var replyFooter = document.getElementById("replyFooter");
    messageList.style.paddingBottom = '';
    replyFooter.style.height = '';
  };

  $scope.updateReplayTextArea = function() {
    var messageList = document.getElementById('messageList').getElementsByClassName('list')[0];
    var replyFooter = document.getElementById("replyFooter");
    var replyTextarea = document.getElementById("replyTextarea");
    replyFooter.style.height = replyTextarea.scrollHeight + 10 + "px";
    messageList.style.paddingBottom = replyTextarea.scrollHeight + 10 + "px";
  }

  //--------------------------------------
  //  Menu popover
  //--------------------------------------

  $ionicPopover.fromTemplateUrl('menu-popover.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.menuPopover = popover;
  });

  $scope.editRoom = function() {
    $scope.menuPopover.hide();

    $scope.editRoomData = {
      'subject': $scope.room.subject
    };

    $ionicPopup.show({
      template: '<input type="text" ng-model="editRoomData.subject">',
      title: 'Title of Room',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.editRoomData.subject) {
              //don't allow the user to close unless he enters wifi password
              e.preventDefault();
            } else {
              $scope.room.subject = $scope.editRoomData.subject;
              $scope.room.$save();
            }
          }
        }
      ]
    });
  };

  $scope.invitePeople = function() {
    $scope.menuPopover.hide();
    $scope.invitePeopleModal.show();
  };

  $scope.exit = function() {
    delete $scope.room.members[$scope.currentUser.$id];
    $scope.room.$save();

    delete $scope.currentUser.rooms[$scope.room.$id];
    $scope.currentUser.$save();

    if(Object.keys($scope.room.members).length === 0) {
      Message($scope.room.$id).$remove();
      $scope.room.$remove();
    }

    $scope.menuPopover.hide();
    $state.go('main.messages');
  };

  //--------------------------------------
  //  Invite People modal
  //--------------------------------------

  $scope.users = Users;

  $ionicModal.fromTemplateUrl('invite-people-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(popover) {
    $scope.invitePeopleModal = popover;
  });

  $scope.cancelInvitePeople = function() {
    angular.forEach($scope.users, function(user) {
      user.selected = false;
    });

    $scope.invitePeopleModal.hide();
  };

  $scope.doneInvitePeople = function() {
    angular.forEach($scope.users, function(value) {
      if(value.selected) {
        $scope.room.members[value.$id] = true;
        $scope.room.$save();

        var user = User(value.$id);
        user.$loaded().then(function() {
          if(!user.rooms) user.rooms = {};
          user.rooms[$scope.room.$id] = true;
          user.$save();
        });

        value.selected = false;
      }
    });

    $scope.invitePeopleModal.hide();
  };

  // Cleanup the modal & popover when view destroyed
  $scope.$on('$destroy', function() {
    $scope.menuPopover.remove();
    $scope.invitePeopleModal.remove();
  });

})

//------------------------------------------------------------------------------
//
//  Settings controller
//
//------------------------------------------------------------------------------

.controller('SettingsCtrl', function($scope) {})
