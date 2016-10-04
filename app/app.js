'use strict';

// Declare app level module which depends on views, and components

angular.module('myApp', [
  'ngRoute',
  'myApp.speedGraph',
  'myApp.speedTable',
  'myApp.speedHistogram',
  'myApp.latency',
  'myApp.domainsByAccesses',
  'myApp.domainsBySize',
  'myApp.version'
]).
config(['$locationProvider', '$routeProvider', '$httpProvider', function($locationProvider, $routeProvider, $httpProvider) {
  $locationProvider.hashPrefix('!');
/*
  $routeProvider.when('/', {
    templateUrl : 'index.html',
    controller : 'home',
    controllerAs: 'controller'
  });
*/
  $routeProvider.
  when('/login', {
    templateUrl : 'login.html',
    controller : 'navigation',
    controllerAs: 'controller'
  }).
  when('/', {
    templateUrl : 'home.html',
    controller : 'home',
    controllerAs: 'controller'
  }).
  otherwise('/');

  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]).

controller('home', function($http) {
  var self = this;
}).

controller('navigation',
  function($rootScope, $http, $location, $route, $routeParams) {

          var self = this;

      $rootScope.rowUserDownloadList =[];
      $rootScope.rowPublicDownloadList =[];

      /**
       * Functions for controlling time
       */
      $rootScope.changeView = function(ele){
          $(".view").removeClass("active");
          var currentParam = $routeParams;
          switch(ele) {
              case 'weekBtn': currentParam.view = "week";  break;
              case 'monthBtn': currentParam.view = "month";    break;
              case 'monthsBtn': currentParam.view = "months";    break;
          }
          $route.updateParams(currentParam);
          $("#" + $routeParams.view + "Btn").addClass("active");

      };
      $rootScope.forward = function(){
          var curDate = moment().year($routeParams.year).month($routeParams.month).date($routeParams.day);
          console.log(curDate.format("YYYY MM DD"));
          switch($routeParams.view){
              case "week":   curDate.add(7,"days");  break;
              case "month":   curDate.add(1,"months"); break;
              case "months": curDate.add(3, "months"); break;
          }
          $route.updateParams({year : curDate.year(), month : curDate.month(), day : curDate.date(), view : $routeParams.view});
      };
      $rootScope.back = function(){
          var curDate = moment().year($routeParams.year).month($routeParams.month).date($routeParams.day);
          console.log(curDate.format("YYYY MM DD"));
          switch($routeParams.view){
              case "week":   curDate.subtract(7,"days");  break;
              case "month":   curDate.subtract(1,"months"); break;
              case "months": curDate.subtract(3, "months"); break;
          }
          $route.updateParams({year : curDate.year(), month : curDate.month(), day : curDate.date(), view : $routeParams.view});
      };

          self.currentDate = moment();

          var authenticate = function(credentials, callback) {

            var headers = credentials ? {authorization : "Basic "
            + btoa(credentials.username + ":" + credentials.password)
            } : {};

              /*
            $http.get('http://169.254.84.99:8080/user', {headers : headers}).then(function(response) {
              if (response.data.name) {
                $rootScope.authenticated = true;
              } else {
                $rootScope.authenticated = false;
              }
              callback && callback();
            }, function() {
              $rootScope.authenticated = false;
              callback && callback();
            });
            */
          };

          authenticate();
          self.credentials = {};
          self.login = function() {
            authenticate(self.credentials, function() {
              if ($rootScope.authenticated) {
                $location.path("/");
                self.error = false;
              } else {
                $location.path("/login");
                self.error = true;
              }
            });
          };
          self.logout = function() {
            $http.post('logout', {}).finally(function() {
              $rootScope.authenticated = false;
              $location.path("/");
            });
          }

        });