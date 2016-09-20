'use strict';

angular.module('myApp.domainsBySize', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/domainsBySize/:year/:month/:day', {
    templateUrl: 'domainsBySize/domainsBySize.html',
    controller: 'domainsBySize'
  });
}])

.controller('domainsBySize', [function() {

}]);