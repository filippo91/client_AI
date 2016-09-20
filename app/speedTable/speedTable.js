'use strict';

angular.module('myApp.speedTable', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/speedTable', {
    templateUrl: 'speedTable/speedTable.html',
    controller: 'speedTable'
  });
}])

.controller('speedTable', [function() {

}]);