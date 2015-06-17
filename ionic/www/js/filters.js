angular.module('angularFirechat.filters', [])

.filter('keys', function() {
  return function(input) {
    if(input) {
      return Object.keys(input);
    } else {
      null;
    }
  }
})
