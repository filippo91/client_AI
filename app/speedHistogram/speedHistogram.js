'use strict';

angular.module('myApp.speedHistogram', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/speedHistogram/:year/:month/:day', {
    templateUrl: 'speedHistogram/speedHistogram.html',
    controller: 'speedHistogram'
  });
}])

.controller('speedHistogram', [function() {

}]);