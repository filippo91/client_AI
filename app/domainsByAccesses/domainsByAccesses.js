'use strict';

angular.module('myApp.domainsByAccesses', ['ngRoute', 'ngResource'])

    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/pieAccesses/:year/:month/:day/:view', {
        templateUrl: 'domainsByAccesses/domainsByAccesses.html',
        controller: 'domainsByAccesses'
      });
    }])

    .controller('domainsByAccesses', ['$route', '$routeParams', '$scope', 'domainsDownloadFactory', function($route, $routeParams, $scope, domainsDownloadFactory) {
        $scope.trigger = {arrived:false};
        $scope.domainList = domainsDownloadFactory.getDomainsAccessData($routeParams.year, $routeParams.month, $routeParams.day, $routeParams.view,$scope.trigger);

    }])

    .factory('domainsDownloadFactory',['$resource', function($resource){
        var requestURI = "http://169.254.84.99:8080/pieAccesses/:year/:month/:day/:view";
        var factory = {};
        factory.getDomainsAccessData = function(year, month, day, view, trigger){
            return $resource(requestURI).query({year : year, month : month, day : day, view : view}, function (domainList) {
                console.log("getDomainsAccessData: " + JSON.stringify(domainList));
                trigger.arrived = true;
            });
        };
        return factory;
    }])

    .directive('accessPie',function(d3Service,domainsDownloadFactory){
        return {
            restrict: 'E',
            link: function(scope,element){
                d3Service.d3().then(function(d3){

                    var width = 960,
                        height = 500,
                        radius = Math.min(width, height) / 2;

                    var color = d3.scale.category20();
                    //.range(["#98abc5","#ff8c00"]);

                    var arc = d3.svg.arc()
                        .outerRadius(radius - 10)
                        .innerRadius(0);

                    var labelArc = d3.svg.arc()
                        .outerRadius(radius - 40)
                        .innerRadius(radius - 40);

                    var pie = d3.layout.pie()
                        .sort(null)
                        .value(function(d) { return d.nRecords; });

                    //console.log(pie);

                    var svg = d3.select(element[0]).append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .append("g")
                        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                    var drawPie = function(){

                        var data =  scope.domainList;
                        if(data === undefined || data.length === 0){
                            svg.append('defs')
                                .append('pattern')
                                .attr('id', 'diagonalHatch')
                                .attr('patternUnits', 'userSpaceOnUse')
                                .attr('width', 10)
                                .attr('height', 10)
                                .append('image')
                                .attr('xlink:href', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSdibGFjaycvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J3doaXRlJyBzdHJva2Utd2lkdGg9JzInLz4KPC9zdmc+')
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('width', 10)
                                .attr('height', 10)
                                .attr('opacity', 0.1);

                            svg.append("circle")
                                .attr("r", radius)
                                .attr('fill', 'url(#diagonalHatch)');

                            svg.append("text")
                                .style("text-anchor", "middle")
                                .style("font-family", "sans-serif")
                                .style("font-size", "20px")
                                .text("No data to show");
                            return;
                        }

                        svg.selectAll(".arc").remove();
                        svg.selectAll("text").remove();
                        svg.selectAll("path").remove();

                        var g = svg.selectAll(".arc")
                            .data(pie(data))
                            .enter().append("g")
                            .attr("class", "arc");

                        g.append("path")
                            .attr("d", arc)
                            .style("fill", function(d) { return color(d.data.server_domain); });

                        g.append("text")
                            .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
                            .attr("dy", ".35em")
                            .text(function(d) { return d.data.server_domain; });
                    };

                    scope.$watch('trigger.arrived', function (newVal) {
                        if(newVal === true)
                            drawPie();
                    });
                    scope.$watch('newUserAsnumDailyAVG_trigger',function(asnum){

                        if(asnum !== undefined) {
                            console.log("disegno pie!");
                            drawPie();
                        }
                    });

                });
            }
        }
});