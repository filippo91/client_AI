'use strict';

angular.module('myApp.latency', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/latency/:year/:month/:day', {
    templateUrl: 'latency/latency.html',
    controller: 'latency'
  });
}])

.controller('latency', [function() {

}]);