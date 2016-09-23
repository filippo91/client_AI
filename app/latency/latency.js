'use strict';

angular.module('myApp.latency', ['ngRoute', 'ngResource'])

    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/latency/:year/:month/:day', {
        templateUrl: 'latency/latency.html',
        controller: 'latency'
      });
    }])

    .controller('latency', ['$route', '$routeParams', 'latencyFactory', '$scope', function($route, $routeParams, latencyFactory, $scope) {
        $scope.latencyData = latencyFactory.getLatencyData($routeParams.year, $routeParams.month, $routeParams.day, $routeParams.view, $routeParams.bin_width);
    }])

    .factory('latencyFactory',['$resource', function($resource){
        var requestURL = "latencyHistogram/:year/:month/:day/:view/:bin_width";
        var factory = {};
        factory.getLatencyData = function(year, month, day, view, bin_width){
            return $resource(requestURL).query({year : year, month : month, day : day, view : view, bin_width : bin_width});
        };
        return factory;
    }]);