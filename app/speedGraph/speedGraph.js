'use strict';

angular.module('myApp.speedGraph', ['ngRoute'])
    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/speedGraph/:year/:month/:day/:view', {
        templateUrl: 'speedGraph/speedGraph.html',
        controller: 'speedGraph',
        controllerAs: 'controller'
      });
    }])
    .controller('speedGraph', ['$route', '$routeParams', '$scope', 'speedGraph_downloadManager', 'getAsnumListFilter',function($route, $routeParams, $scope, downloadManager, getAsnumListFilter) {
            $scope.trigger = {startDataArrived:false, count:0};
            $scope.moreData = function(timestamp, viewReq){
                console.log("timestamp: " + timestamp + ", viewReq: " +viewReq);
                $scope.$apply($route.updateParams({year: timestamp.year(), month: timestamp.month(), day: timestamp.day(), view : viewReq}));
            };
            $scope.userDownloadList = []; $scope.publicDownloadList = []; $scope.rowUserDownloadList = [];
            var updateUserDownload = function(data){ $scope.userDownloadList = downloadManager.splitByAsnum(data); $scope.rowUserDownloadList = data};
            var updatePublicDownload = function(data){ $scope.publicDownloadList = downloadManager.splitByAsnum(data);};
            downloadManager.getUserDownloads($routeParams.year, $routeParams.month, $routeParams.day, $routeParams.view, $scope.trigger,updateUserDownload);
            downloadManager.getPublicDownloads($routeParams.year, $routeParams.month, $routeParams.day, $routeParams.view, $scope.trigger,updatePublicDownload);

            $scope.showGraph = function(ele,$event){$(".graphButton").removeClass("active");$($event.target).addClass("active");$(".graph").hide();$(ele).show();};
            $scope.showAllAsnum = function(type){
                var ele,show = true;
                if(type == 1) ele = $('#general-hist-showAll'); else ele = $('#general-graph-showAll');
                if(ele.attr('isVisible') === 'true'){
                    ele.removeClass('active');show = false;ele.attr('isVisible','false')
                }else{ele.attr('isVisible','true');
                    ele.addClass('active');}

                getAsnumListFilter($scope.publiDownloadList).forEach(function(e){
                    var tri = fromAsnumToTriObj(type==1,false,e);
                    if(show) showAsnum(tri); else hideAsnum(tri);
                });
            };
            $scope.showAllUserAsnum = function(type){
                var ele,show = true;
                if(type == 1) ele = $('#user-hist-showAll'); else ele = $('#user-graph-showAll');
                if(ele.attr('isVisible') === 'true') {
                    ele.removeClass('active');
                    show = false;
                    ele.attr('isVisible','false')
                }else{ele.attr('isVisible','true');ele.addClass('active');}
                getAsnumListFilter($scope.userDownloadList).forEach(function(e){
                    var tri = fromAsnumToTriObj(type==1,true,e);
                    if(show) showAsnum(tri); else hideAsnum(tri);
                });
            };
            function fromAsnumToTriObj(isHisto,isUser,asnum){
                var graph,ele,btn;
                if(isHisto){
                    if(isUser){
                        graph = $('.user-hist-' + asnum);
                        ele = $('#user-hist-asnum-' + asnum);
                        btn = $('#user-hist-button-' + asnum);
                    }else{
                        graph = $('.general-hist-'+asnum);
                        ele = $('#general-hist-asnum-'+asnum);
                        btn = $('#general-hist-button-'+asnum);
                    }
                }else{
                    if(isUser){
                        graph = $('.user-graph-' + asnum);
                        ele = $('#user-graph-asnum-' + asnum);
                        btn = $('#user-graph-button-' + asnum);
                    }else{
                        graph = $('.general-graph-'+asnum);
                        ele = $('#general-graph-asnum-'+asnum);
                        btn = $('#general-graph-button-'+asnum);
                    }
                }
                console.log("tri:");console.log({g:graph,e:ele,b:btn});
                return {g:graph,e:ele,b:btn};
            }
            function showAsnum(tri){
                var graph = tri.g, ele = tri.e, btn = tri.b;
                graph.show();
                ele.attr('isVisible', 'true');
                graph.attr('isVisible', 'true');
                btn.attr('class','btn btn-default ng-binding active');
            }
            function hideAsnum(tri){
                var graph = tri.g, ele = tri.e, btn = tri.b;
                graph.hide();
                ele.attr('isVisible','false');
                graph.attr('isVisible','false');
                btn.attr('class','btn btn-default ng-binding');
            }
            $scope.showAsnum = function(asnum,type){
                var tri = fromAsnumToTriObj(type==1,false,asnum);
                if(tri.e.attr('isVisible') === 'true'){
                    hideAsnum(tri);
                }else{
                    showAsnum(tri);
                }
            };
            $scope.showUserAsnum = function(asnum,type){
                var tri = fromAsnumToTriObj(type==1,true,asnum);
                if(tri.e.attr('isVisible') === 'true'){
                    hideAsnum(tri);
                }else{
                    showAsnum(tri);
                }
            };

        $()

    }])
    .factory('speedGraph_downloadManager', ['$resource', function($resource) {
            var serverURI_user = "http://169.254.84.99:8080/speedGraph/:year/:month/:day/:view",//http://169.254.84.99:8080/speedTable/:page/:size/";
                serverURI_public = "http://169.254.84.99:8080/speedGraphPublic/:year/:month/:day/:view";
            var factory = {};

            factory.splitByAsnum = function(downloadList){
                var asnumList = [];
                for(var i=0;i<downloadList.length;i++){
                    for(var j=0;j<asnumList.length;j++){
                        if(downloadList[i].asnum === asnumList[j].asnum){
                            asnumList[j].downloads.push(downloadList[i]);
                            break;
                        }
                    }
                    if(j===asnumList.length){
                        var newDownloads =[];
                        newDownloads.push(downloadList[i]);
                        asnumList.push({"asnum":downloadList[i].asnum,"downloads": newDownloads});
                    }
                }
                return asnumList;
            };
            factory.getUserDownloads = function (year,month,day,view,trigger, callback) {
                return [{
                    "asnum": 0,
                    "speed": 1050,
                    "timestamp": 1474467460924,
                    "count" : 1
                }];
                /*
                $resource(serverURI_user).query({year: year, month : month, day : day, view : view}, function (downloadList) {
                    downloadList.sort(function (a, b) {return a.timestamp - b.timestamp;});
                    callback(downloadList);
                    trigger.startDataArrived = ++trigger.count === 2;
                });
                */
            };
            factory.getPublicDownloads = function (year,month,day,view,trigger, callback) {
                return [{
                    "asnum": 0,
                    "speed": 1050,
                    "timestamp": 1474467460924,
                    "count" : 1
                },{
                    "asnum": 1,
                    "speed": 1050,
                    "timestamp": 1474467460924,
                    "count" : 1
                },{
                    "asnum": 2,
                    "speed": 1050,
                    "timestamp": 1474467460924,
                    "count" : 1
                },{
                    "asnum": 3,
                    "speed": 1050,
                    "timestamp": 1474467460924,
                    "count" : 1
                },{
                    "asnum": 4,
                    "speed": 1050,
                    "timestamp": 1474467460924,
                    "count" : 1
                },{
                    "asnum": 5,
                    "speed": 1050,
                    "timestamp": 1474467460924,
                    "count" : 1
                }];
                /*
                $resource(serverURI_public).query({year: year, month : month, day : day, view : view}, function (downloadList) {
                    downloadList.sort(function (a, b) {return a.timestamp - b.timestamp;});
                    callback(downloadList);
                    trigger.startDataArrived = ++trigger.count === 2;
                });
                */
            };
            return factory;
        }])
    .factory('d3Service', ['$document', '$q', '$rootScope',
        function($document, $q, $rootScope) {
            var d = $q.defer();
            function onScriptLoad() {
                // Load client in the browser
                $rootScope.$apply(function() { d.resolve(window.d3); });
            }
            // Create a script tag with d3 as the source
            // and call our onScriptLoad callback when it
            // has been loaded
            var scriptTag = $document[0].createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.async = true;
            scriptTag.src = 'http://d3js.org/d3.v3.min.js';
            scriptTag.onreadystatechange = function () {
                if (this.readyState == 'complete') onScriptLoad();
            };
            scriptTag.onload = onScriptLoad;

            var s = $document[0].getElementsByTagName('body')[0];
            s.appendChild(scriptTag);

            return {
                d3: function() { return d.promise; }
            };
        }])
    .filter('getAsnumList',function(){
        return function(input){
            if(input === undefined || input.length === 0) return [];
            return input.map(function(d){return d.asnum;}).sort(function(a,b){return parseInt(a)> parseInt(b);});
        };
    })
    .directive('downloadSpeedTemporalGraph',function($route, $routeParams,d3Service){
        return{
            restrict: 'E',
            link: function(scope, element, attrs){
                d3Service.d3().then(function (d3) {
                    var circleSize = 5;
                    var colorMap;
                    var colors = d3.scale.category20();
                    var margin = {top: 10, right: 10, bottom: 100, left: 50},
                        margin2 = {top: 430, right: 10, bottom: 20, left: 0},
                        width = 960 - margin.left - margin.right,
                        height = 500 - margin.top - margin.bottom,
                        height2 = 500 - margin2.top - margin2.bottom;
                    var x = d3.time.scale().range([0, width]),
                        x2 = d3.time.scale().range([0, width]),
                        y = d3.scale.linear().range([height, 0]),
                        y2 = d3.scale.linear().range([height2, 0]);
                    var speedFormat = function (d) {
                        if (parseInt(d) > 1024 * 1024 * 1024) return "" + parseInt(parseInt(d) / (1024 * 1024 * 1024)) + "\nGbps";
                        if (parseInt(d) > 1024 * 1024) return "" + parseInt(parseInt(d) / (1024 * 1024)) + "\nMbps";
                        if (parseInt(d) > 1024) return "" + parseInt(parseInt(d) / 1024) + "\nKbps";
                        return "" + d;
                    };

                    var line = d3.svg.line()
                        .x(function (d) {return x(d.timestamp);})
                        .y(function (d) {return y(d.speed);})
                        .interpolate("monotone");
                    //.interpolate("linear ");

                    var svg = d3.select(element[0]).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom);

                    svg.append("defs").append("clipPath")
                        .attr("id", "clip")
                        .append("rect")
                        .attr("width", width)
                        .attr("height", height);

                    var focus = svg.append("g")
                        .attr("class", "focus")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    var div = d3.select(element[0]).append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    var formatTime = d3.time.format("%e/%m/%Y");

                    scope.$watch('trigger.startDataArrived', function (newVal) {
                        if (newVal === true) {
                            console.log("triggered");
                            d3Service.d3().then(function (d3) {

                                //if (scope.userDownloadList.length === 0){ console.log("vuoto"); return;}

                                colorMap = scope.publicDownloadList.map(function(d){return d.asnum;});

                                colorMap.forEach(function (asn, i) {
                                    $('#general-graph-button-' + asn).css('color', colors(i));
                                    $('#user-graph-button-' + asn).css('color', colors(i));
                                });
                                var userDownloadList = scope.userDownloadList;
                                var publicDownloadList = scope.publicDownloadList;

                                var xAxis = d3.svg.axis().scale(x).orient("bottom"),//.ticks(d3.time.day),
                                    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
                                    yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(speedFormat);

                                var brush = d3.svg.brush().x(x2).on("brush", brushed);

                                //user data
                                var area = d3.svg.area()
                                    .interpolate("monotone")
                                    //.interpolate("linear ")
                                    .x(function (d) {return x(d.timestamp);})
                                    .y0(height)
                                    .y1(function (d) {return y(d.speed);});

                                var area2 = d3.svg.area()
                                    .interpolate("monotone")
                                    //.interpolate("linear ")
                                    .x(function (d) {return x2(d.timestamp);})
                                    .y0(height2)
                                    .y1(function (d) {return y2(d.speed);});

                                var buttonsDiv = d3.select('#btnDiv');

                                var view = buttonsDiv.selectAll("buttonView").data(["week", "month", "multi-month"])
                                    .enter().append("button").attr("class", " btn btn-default buttonView button")//.style("display","inline-block")
                                    .attr("type", "button");

                                buttonsDiv.append("div").style("width", "25px").style("height", "auto").style("display", "inline-block");

                                var moveButton = buttonsDiv.selectAll("buttonMove").data(["<", ">"])
                                    .enter().append("button").attr("class", "btn btn-default buttonMove button active").style("display", "inline-block")
                                    .on("click", moveFocus);

                                buttonsDiv.append("div").style("width", "25px").style("height", "auto").style("display", "inline-block");

                                var textArea = buttonsDiv.append("div").style("display", "inline-block").style('font-size', '14px');

                                // fill the buttons with the year from the data assigned to them
                                d3.selectAll(".buttonMove,.buttonView").text(function (d) {return d;});

                                view.on("click", changeView);

                                /**
                                 * Prendo i valori di inizio dalla URL {year : $routeParams.year, month : $routeParams.month, day : $routeParams.day, hour :0, minute : 0, second : 0, millisecond : 0}
                                 */
                                //var firstDate = moment(publicDownloadList[0].timestamp), lastDate = moment(publicDownloadList[0].timestamp),
                                var firstDate = moment({year : $routeParams.year, month : $routeParams.month, day : $routeParams.day, hour :0, minute : 0, second : 0, millisecond : 0}),
                                    lastDate = moment({year : $routeParams.year, month : $routeParams.month, day : $routeParams.day, hour :0, minute : 0, second : 0, millisecond : 0}),
                                    firstExt, lastExt, format = "dddd D MMM YYYY", viewStatus, num;

                                function changeView(data) {
                                    d3.selectAll(".buttonView").attr("class", "btn btn-default buttonView button");
                                    d3.select(this).attr("class", "btn btn-default buttonView button active");
                                    console.log("changeview : " + JSON.stringify($routeParams));
                                    console.log($route);
                                    lastDate = moment(firstDate);
                                    var viewReq = data;

                                    if (data === "week") {
                                        num = 1;
                                        firstExt = firstDate;
                                        lastExt = lastDate.add(7, "days");
                                        viewStatus = "weeks";
                                    } else if (data === "month") {
                                        num = 1;
                                        viewStatus = "months";
                                        firstExt = firstDate.date(1);
                                        lastExt = lastDate.endOf("month");
                                    } else if (data === "multi-month") {
                                        viewReq = "months";
                                        viewStatus = "months";
                                        num = 3;
                                        firstExt = firstDate.date(1);
                                        lastExt = lastDate.add(num, "months").endOf("month");
                                    } else {
                                        return;
                                    }
                                    scope.moreData(firstDate,viewReq);
                                    moveButton.attr("class", "btn btn-default buttonMove button");
                                    drawBrush();
                                }

                                function moveFocus(d) {
                                    //console.log(d);
                                    if (firstExt === undefined || lastExt === undefined || viewStatus === undefined) return;
                                    if (d === "<") {
                                        firstExt.subtract(num, viewStatus);
                                        lastExt.subtract(num, viewStatus);
                                    } else if (d === ">") {
                                        firstExt.add(num, viewStatus);
                                        lastExt.add(num, viewStatus);
                                    } else {
                                        return;
                                    }
                                    drawBrush();
                                }

                                function drawBrush() {
                                    textArea.text(viewStatus + ": " + firstExt.format(format) + " - " + lastExt.format(format));
                                    brush.extent([new Date(firstExt.format(format)), new Date(lastExt.format(format))]);

                                    // now draw the brush to match our extent
                                    // use transition to slow it down so we can see what is happening
                                    // remove transition so just d3.select(".brush") to just draw
                                    brush(d3.select(".brush").transition());

                                    // now fire the brushstart, brushmove, and brushend events
                                    // remove transition so just d3.select(".brush") to just draw
                                    brush.event(d3.select(".brush").transition())
                                }

                                var context = svg.append("g")
                                    .attr("class", "context")
                                    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

                                var zoom = d3.behavior.zoom()
                                    .on("zoom", draw);

                                var rect = svg.append("svg:rect")
                                    .attr("class", "pane")
                                    .attr("width", width)
                                    .attr("height", height)
                                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                                    //.on('mouseover',rectMouseOver)
                                    .call(zoom);

                                //max user
                                var maxList_y_user = [], maxList_y_pub = [], valueList_x_user = [], valueList_x_pub = [];
                                publicDownloadList.forEach(function (d, i) {
                                    maxList_y_user[i] = d3.max(d.downloads.map(function (d) {return d.speed;}));
                                    valueList_x_user = d.downloads.map(function (d) {return d.timestamp;});
                                });
                                userDownloadList.forEach(function (d, i) {
                                    maxList_y_pub[i] = d3.max(d.downloads.map(function (d) {return d.speed;}));
                                    valueList_x_pub = d.downloads.map(function (d) {return d.timestamp;});
                                });
                                var valueList_x = valueList_x_pub.concat(valueList_x_user), maxList_y = maxList_y_pub.concat(maxList_y_pub);

                                x.domain(d3.extent(valueList_x));
                                y.domain([0, d3.max(maxList_y) * 1.3]);
                                x2.domain(x.domain());
                                y2.domain(y.domain());

                                // Set up zoom behavior
                                zoom.x(x);

                                /**
                                 * Disegno grafico utente
                                 * */
                                 userDownloadList.forEach(function (asnum) {
                                    var data = asnum.downloads;
                                     console.log(JSON.stringify(asnum.downloads));
                                    data.forEach(function (dd) {
                                        dd.timestamp = new Date(dd.timestamp);
                                        focus.append("circle").datum(dd)
                                            .attr("class", "point general-graph-" + asnum.asnum)
                                            .attr("cx", function (d) {
                                                return x(d.timestamp)
                                            })
                                            .attr("cy", function (d) {
                                                return y(d.speed)
                                            })
                                            .attr("clip-path", "url(#clip)")
                                            .attr("r", circleSize)
                                            .attr("isvisible", "false")
                                            .attr("ds", function (d) {
                                                return d.speed;
                                            })
                                            .attr("ts", function (d) {
                                                return formatTime(d.timestamp);
                                            })
                                            .attr("fill", colors(colorMap.indexOf(asnum.asnum)));
                                    });

                                    focus.append("path")
                                        .datum(data)
                                        .attr("class", "line general-graph-" + asnum.asnum)
                                        .attr("d", line)
                                        .attr("clip-path", "url(#clip)")
                                        .attr("fill", "none")//,function(){return colors(i);})
                                        .attr("stroke", colors(colorMap.indexOf(asnum.asnum)))
                                        .style("stroke-dasharray", ("3, 3"));
                                });

                                /**
                                 * Disegno grafico pubblico
                                 * */
                                publicDownloadList.forEach(function (e) {
                                    e.downloads.forEach(function (ee) {
                                        ee.timestamp = new Date(ee.timestamp);
                                        focus.append("circle").datum(ee)
                                            .attr("class", "point user-graph-" + e.asnum)
                                            .attr("cx", function (d) {
                                                return x(d.timestamp)
                                            })
                                            .attr("cy", function (d) {
                                                return y(d.speed)
                                            })
                                            .attr("clip-path", "url(#clip)")
                                            .attr("isvisible", "true")
                                            .attr("ds", function (d) {
                                                return d.speed;
                                            })
                                            .attr("ts", function (d) {
                                                return formatTime(d.timestamp);
                                            })
                                            .attr("r", circleSize)
                                            .attr("fill", colors(colorMap.indexOf(e.asnum)));
                                    });
                                    focus.append("path")
                                        .datum(e.downloads)
                                        .attr("class", "line user-graph-" + e.asnum)
                                        .attr("d", line)
                                        .attr("clip-path", "url(#clip)")
                                        .attr("fill", "none")
                                        .attr("stroke", colors(colorMap.indexOf(e.asnum)));

                                });

                                focus.append("g")
                                    .attr("class", "x axis")
                                    .attr("transform", "translate(0," + height + ")")
                                    .call(xAxis);

                                focus.append("g")
                                    .attr("class", "y axis")
                                    .call(yAxis);

                                context.append("path")
                                    .datum(scope.rowUserDownloadList)
                                    .attr("class", "area")
                                    .attr("d", area2);

                                context.append("g")
                                    .attr("class", "x axis")
                                    .attr("transform", "translate(0," + height2 + ")")
                                    .call(xAxis2);

                                context.append("g")
                                    .attr("class", "x brush")
                                    .call(brush)
                                    .selectAll("rect")
                                    .attr("y", -6)
                                    .attr("height", height2 + 7);

                                brush.extent([new Date(d3.min(valueList_x)), new Date(d3.max(valueList_x))]);
                                d3.selectAll("path.domain").style("shape-rendering", "geometricPrecision");

                                function brushed() {
                                    if (brush.empty()) {
                                        x.domain(x2.domain());
                                    } else {
                                        var extent = brush.extent();
                                        var width = extent[1] - extent[0];
                                        if (width < 86400000 * 7) {
                                            var padding = (86400000 * 7 - width) / 2;
                                            extent[0].setTime(parseInt(extent[0].getTime()) - padding);
                                            extent[1].setTime(parseInt(extent[1].getTime()) + padding);
                                            brush.extent(extent);
                                            svg.select(".brush").call(brush);
                                        }
                                        x.domain(extent);
                                    }
                                    focus.selectAll(".area").attr("d", area);
                                    focus.selectAll(".line").attr("d", line);
                                    focus.selectAll('.point')
                                        .attr("cx", function (d) {
                                            return x(d.timestamp)
                                        })
                                        .attr("cy", function (d) {
                                            return y(d.speed)
                                        });
                                    focus.select(".x.axis").call(xAxis);
                                    zoom.x(x);
                                }

                                function draw() {
                                    focus.selectAll(".area").attr("d", area);
                                    focus.selectAll(".line").attr("d", line);
                                    focus.selectAll('.point')
                                        .attr("cx", function (d) {
                                            return x(d.timestamp)
                                        })
                                        .attr("cy", function (d) {
                                            return y(d.speed)
                                        });
                                    focus.select(".x.axis").call(xAxis);
                                    // Force changing brush range
                                    brush.extent(x.domain());
                                    svg.select(".brush").call(brush);
                                }


                                colorMap.forEach(function (asn) {
                                    $('.general-graph-' + asn).hide();
                                });

                                $('.pane').mousemove(function (e) {
                                    var pane = $('.pane');
                                    var offset = pane.offset();
                                    var x = e.pageX - parseInt(offset.left), y = e.pageY - parseInt(offset.top);

                                    var elements = $('.point').filter("[isvisible='true']").map(function () {
                                        var $this = $(this);
                                        var cx = parseInt($this.attr("cx"));
                                        var cy = parseInt($this.attr("cy"));
                                        var r = parseInt($this.attr("r"));

                                        if ((y <= cy + r && y >= cy - r) && (x <= cx + r && x >= cx - r)) {
                                            return $this;
                                        }
                                        return null;
                                    });
                                    if (elements.length === 0) {
                                        pane.css('cursor', 'default');
                                        div.transition()
                                            .duration(200)
                                            .style("opacity", 0);
                                        return;
                                    }
                                    var ds = elements[0].attr('ds');
                                    var ts = elements[0].attr('ts');
                                    pane.css('cursor', 'pointer');
                                    div.transition()
                                        .duration(200)
                                        .style("opacity", .9);
                                    div.html(speedFormat(ds) + "<br/><i>" + ts + "</i>")
                                        .style("left", (x) + "px")
                                        .style("top", (y - 28) + "px");
                                });

                            });
                        }
                    });
                    /*
                    scope.$watch('newAsnumDailyAVG_trigger', function (newAsnum) {
                        colorMap = getAsnumListFilter(scope.downloadList);


                        colorMap.forEach(function (asn, i) {
                            $('#button-' + asn).css('color', colors(i));
                            $('#user-button-' + asn).css('color', colors(i));
                        });
                        if(newAsnum != undefined){
                            console.log("asnum triggered");
                            console.log(newAsnum);
                            //1 aggiungere pallino

                            var isVisible = $('#asnum-'+newAsnum.asnum).attr("isvisible");


                            //togliere linea dell/asnum

                            var element =  focus.selectAll(".general-graph-" + newAsnum.asnum);
                            console.log(element);
                            element.remove();
                            var newLine;
                            //disegnare nuovo asnum path
                            for(var i = 0 ; i < scope.asnumDailyDownloads.length; i++){
                                if(scope.asnumDailyDownloads[i].asnum === newAsnum.asnum){
                                    scope.asnumDailyDownloads[i].downloads.sort(function(a,b){return a.timestamp - b.timestamp;});
                                    //scope.asnumDailyDownloads[i].downloads
                                    scope.asnumDailyDownloads[i].downloads.forEach(function(ee){
                                        focus.append("circle").datum(ee)
                                            .attr("class", "point general-graph-" + newAsnum.asnum)
                                            .attr("cx", function (d) {return x(d.timestamp)})
                                            .attr("cy", function (d) {return y(d.speed)})
                                            .attr("clip-path", "url(#clip)")
                                            .attr("r", circleSize)
                                            .attr("isvisible", isVisible)
                                            .attr("ds", function (d) {return d.speed;})
                                            .attr("ts", function (d) {return formatTime(d.timestamp);})
                                            .attr("fill", colors(colorMap.indexOf(newAsnum.asnum)));
                                    });

                                    var index = colorMap.indexOf(scope.asnumDailyDownloads[i].asnum);
                                    console.log(scope.asnumDailyDownloads[i].downloads);
                                    newLine = focus.append("path")
                                        .datum(scope.asnumDailyDownloads[i].downloads)
                                        .attr("class", "line general-graph-" + scope.asnumDailyDownloads[i].asnum)
                                        .attr("d", line)
                                        .attr("clip-path", "url(#clip)")
                                        .attr("fill", "none")
                                        .attr("stroke", colors(index))
                                        .style("stroke-dasharray", ("3, 3"));
                                    break;
                                }
                            }
                            if(isVisible == "false"){
                                $(".general-graph-" + newAsnum.asnum).hide();
                            }
                        }
                    });
                    scope.$watch('newUserAsnumDailyAVG_trigger',function(asnum){
                        console.log("asnum///s " + asnum);
                        var element =  focus.selectAll(".user-graph-" + asnum);
                        console.log(element);
                        element.remove();
                        var userSplittedList = downloadFactory.splitByAsnum(scope.downloadList);

                        userSplittedList.forEach(function (e) {
                            e.downloads = downloadFactory.compressDailyDownloads(e.downloads);
                        });

                        var isVisible = $('#user-asnum-'+asnum).attr("isvisible");

                        userSplittedList.forEach(function (e) {
                            if(asnum === e.asnum) {
                                e.downloads.forEach(function (ee) {
                                    ee.timestamp = new Date(ee.timestamp);
                                    focus.append("circle").datum(ee)
                                        .attr("class", "point user-graph-" + e.asnum)
                                        .attr("cx", function (d) {return x(d.timestamp);})
                                        .attr("cy", function (d) {return y(d.speed);})
                                        .attr("clip-path", "url(#clip)")
                                        .attr("isvisible", isVisible)
                                        .attr("ds", function (d) {return d.speed;})
                                        .attr("ts", function (d) {return formatTime(d.timestamp);})
                                        .attr("r", circleSize)
                                        .attr("fill", colors(colorMap.indexOf(e.asnum)));
                                });
                                focus.append("path")
                                    .datum(e.downloads)
                                    .attr("class", "line user-graph-" + e.asnum)
                                    .attr("d", line)
                                    .attr("clip-path", "url(#clip)")
                                    .attr("fill", "none")
                                    .attr("stroke", colors(colorMap.indexOf(e.asnum)));
                            }

                        });
                        if(isVisible == "false"){
                            $(".user-graph-" + asnum).hide();
                        }

                    });
                    */
                    var getAsnumList = function(downloadList){
                        var list = [];
                        downloadList.forEach(function(e){if(list.indexOf(e.asnum) === -1) list.push(e.asnum)});
                        return list;
                    }
                });
            }
        }
    });
