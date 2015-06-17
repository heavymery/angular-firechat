angular.module('angularFirechat.services', ['firebase'])

//------------------------------------------------------------------------------
//
//  Firebase
//
//------------------------------------------------------------------------------

.factory("FireRef", function($window) {
  return new $window.Firebase('https//angular-firechat.firebaseio.com');
})

//--------------------------------------
//  Authentication
//--------------------------------------

.factory("Auth", function(FireRef, $firebaseAuth) {
  return $firebaseAuth(FireRef);
})

//--------------------------------------
//  Data models
//--------------------------------------

.factory("User", function(FireRef, $firebaseObject) {
  return function(userId) {
    return $firebaseObject(FireRef.child('users').child(userId));
  }
})

.factory("Users", function(FireRef, $firebaseArray) {
  return $firebaseArray(FireRef.child('users'));
})

.factory("Room", function(FireRef, $firebaseObject) {
  return function(roomId) {
    return $firebaseObject(FireRef.child('rooms').child(roomId));
  }
})

.factory("Rooms", function(FireRef, $firebaseArray) {
  return $firebaseArray(FireRef.child('rooms'));
})

.factory("Message", function(FireRef, $firebaseObject) {
  return function(roomId) {
    return $firebaseObject(FireRef.child('messages').child(roomId));
  }
})

.factory("Messages", function(FireRef, $firebaseArray) {
  return function(roomId) {
    return $firebaseArray(FireRef.child('messages').child(roomId));
  }
})
