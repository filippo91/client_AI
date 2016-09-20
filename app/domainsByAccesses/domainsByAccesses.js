'use strict';

angular.module('myApp.domainsByAccesses', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/domainsByAccesses/:year/:month/:day', {
    templateUrl: 'domainsByAccesses/domainsByAccesses.html',
    controller: 'domainsByAccesses'
  });
}])

.controller('domainsByAccesses', [function() {

}]);