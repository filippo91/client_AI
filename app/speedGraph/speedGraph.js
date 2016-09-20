'use strict';

angular.module('myApp.speedGraph', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/speedGraph/:year/:month/:day', {
    templateUrl: 'speedGraph/speedGraph.html',
    controller: 'speedGraph',
    controllerAs: 'controller'
  });
}])

.controller('speedGraph', [function() {
  this.today = new Date();
  this.todayMoment = moment().calendar();
  var map = new Map();
  var date = new Date();
  map.set(date, "download speed");
  console.log("Date: " + date + " " + map.get(date));
}]);