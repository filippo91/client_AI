'use strict';

angular.module('myApp.speedGraph', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/speedGraph/:year/:month/:day', {
    templateUrl: 'speedGraph/speedGraph.html',
    controller: 'speedGraph',
    controllerAs: 'controller'
  });
}])

.controller('speedGraph', ['downloadManager',function(downloadManager) {
        /*
        this.today = new Date();
        this.todayMoment = moment().calendar();
        var map = new Map();
        var date = new Date();
        map.set(date, "download speed");
        console.log("Date: " + date + " " + map.get(date));
        */
        downloadManager.getDownloads(2016,7,1,'months');

}])
    .factory('downloadManager', ['$resource', function($resource) {
        var serverURI = "http://169.254.84.99:8080/speedGraph/:year/:month/:day/:view";//http://169.254.84.99:8080/speedTable/:page/:size/";
        var factory = {};
        factory.getDownloads = function (year,month,day,view,trigger) {
            return $resource(serverURI).query({year: year, month : month, day : day, view : view}, function (downloadList) {
                downloadList.sort(function (a, b) {return a.timestamp - b.timestamp;});
                trigger
            });
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
    .directive('downloadSpeedTemporalGraph',function(d3Service,downloadManager){
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
                        .y(function (d) {return y(d.download_speed);})
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
                    // Define the div for the tooltip
                    var div = d3.select(element[0]).append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    var formatTime = d3.time.format("%e/%m/%Y");

                    scope.$watch('startDataArrived_trigger.isNewTrigger', function (newVal, oldVal) {
                        //$("download-speed-temporal-graph").empty();
                        //console.log("new>"); console.log(newVal);
                        //console.log("old>"); console.log(oldVal);
                        if (newVal === true) {
                            console.log("triggered");
                            d3Service.d3().then(function (d3) {

                                //d3.select("svg").remove();
                                //d3.select("#btnDiv").remove();
                                if (scope.downloadList.length === 0) return;

                                colorMap = getAsnumListFilter(scope.downloadList);

                                colorMap.forEach(function (asn, i) {
                                    $('#general-graph-button-' + asn).css('color', colors(i));
                                    $('#user-graph-button-' + asn).css('color', colors(i));
                                });

                                var userSplittedList = downloadFactory.splitByAsnum(scope.downloadList);

                                userSplittedList.forEach(function (e) {
                                    e.downloads = downloadFactory.compressDailyDownloads(e.downloads);
                                });
                                var json = downloadFactory.compressDailyDownloads(scope.downloadList);
                                var asnumList = scope.asnumDailyDownloads;
                                //console.log("confronto \n");
                                //console.log(JSON.stringify(userSplittedList));
                                //asnumList.forEach(function(e){
                                //    console.log("asnum> " + e.asnum);
                                //    console.log(JSON.stringify(e.downloadSpeeds))
                                //});

                                var xAxis = d3.svg.axis().scale(x).orient("bottom"),//.ticks(d3.time.day),
                                    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
                                    yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(speedFormat);



                                var brush = d3.svg.brush().x(x2).on("brush", brushed);//2(brush ,86400000*10,86400000*100));

                                //user data
                                var area = d3.svg.area()
                                    .interpolate("monotone")
                                    //.interpolate("linear ")
                                    .x(function (d) {return x(d.timestamp);})
                                    .y0(height)
                                    .y1(function (d) {return y(d.download_speed);});



                                var area2 = d3.svg.area()
                                    .interpolate("monotone")
                                    //.interpolate("linear ")
                                    .x(function (d) {return x2(d.timestamp);})
                                    .y0(height2)
                                    .y1(function (d) {return y2(d.download_speed);});

                                //asnum data
                                //var asnum_area = [],asnum_line = [], asnum_area2 = [];
                                //asnumList.forEach(function(asnumData){
                                //    asnum_area[asnum_area.length] = d3.svg.area()
                                //        .interpolate("monotone")
                                //        .x(function(d) { return x(d.timestamp); })
                                //        .y0(height)
                                //        .y1(function(d) { return y(d.download_speed); });
                                //});
                                //buton area
                                //var asnumsChoise = d3.select(element[0]).append("div").attr("class","btn-group");
                                //asnumsChoise.append("button").attr("class","btn btn-default drop-toggle")
                                //    .attr("data-toggle","dropdown").attr("aria-haspopup","true")
                                //    .attr("aria-expanded","false").text("Show").append("span").attr("class","caret");
                                //var asnumChoiseList = asnumsChoise.append("ul").attr()
                                //var buttonsDiv = d3.select(element[0]).append("div").attr("id","btnDiv");//.text("view: ");
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

                                //view.each(function (d) {
                                //	this.innerText = d;
                                //});

                                view.on("click", changeView);
                                //settare first date con la data corretta

                                var firstDate = moment(json[0].timestamp), lastDate = moment(json[0].timestamp),
                                    firstExt, lastExt, format = "dddd D MMM YYYY", viewStatus, num;

                                function changeView(data) {
                                    d3.selectAll(".buttonView").attr("class", "btn btn-default buttonView button");
                                    d3.select(this).attr("class", "btn btn-default buttonView button active");

                                    lastDate = moment(firstDate);

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
                                        viewStatus = "months";
                                        num = 6;
                                        firstExt = firstDate.date(1);
                                        lastExt = lastDate.add(num, "months").endOf("month");
                                    } else {
                                        return;
                                    }
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

                                var canZoom = false;
                                var zoom = d3.behavior.zoom()
                                    //.scaleExtent([1,10])
                                    .on("zoom", draw);
                                //.on("zoomstart",zoomstart);
                                //.on("zoomend",zoomend);

// Add rect cover the zoomed graph and attach zoom event.
                                var rect = svg.append("svg:rect")
                                    .attr("class", "pane")
                                    .attr("width", width)
                                    .attr("height", height)
                                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                                    //.on('mouseover',rectMouseOver)
                                    .call(zoom);


                                //d3.json("view1/dataTest.json", function(error, json) {
                                //if (error) return console.warn(error);

                                //console.log(d3.extent(json));

                                //json.forEach(function(d){d.timestamp = new Date(d.timestamp);});


                                //console.log(d3.extent(json.map(function (d) {
                                //    return d.timestamp
                                //})));

                                var maxList_y = [], maxList_x = [];
                                maxList_y[0] = d3.max(json.map(function (d) {return d.download_speed;}));
                                maxList_x = json.map(function (d) {return d.timestamp;});
                                asnumList.forEach(function (d, i) {
                                    maxList_y[i + 1] = d3.max(d.downloadSpeeds.map(function (d) {
                                        return d.download_speed;
                                    }));
                                    maxList_x = maxList_x.concat(d.downloadSpeeds.map(function (d) {
                                        return d.timestamp;
                                    }));
                                });
                                //x.domain(d3.extent(json.map(function(d){ return d.timestamp;})));
                                x.domain(d3.extent(maxList_x));
                                y.domain([0, d3.max(maxList_y) * 1.3]);
                                x2.domain(x.domain());
                                y2.domain(y.domain());

                                // Set up zoom behavior
                                zoom.x(x);

                                //asnum data
                                ///*


                                asnumList.forEach(function (asnum, i) {

                                    var data = asnum.downloadSpeeds;

                                    data.forEach(function (dd) {
                                        dd.timestamp = new Date(dd.timestamp);
                                        focus.append("circle").datum(dd)
                                            .attr("class", "point general-graph-" + asnum.asnum)
                                            .attr("cx", function (d) {
                                                //console.log(d);
                                                return x(d.timestamp)
                                            })
                                            .attr("cy", function (d) {
                                                return y(d.download_speed)
                                            })
                                            .attr("clip-path", "url(#clip)")
                                            .attr("r", circleSize)
                                            .attr("isvisible", "false")
                                            .attr("ds", function (d) {
                                                return d.download_speed;
                                            })
                                            .attr("ts", function (d) {
                                                return formatTime(d.timestamp);
                                            })
                                            .attr("fill", colors(colorMap.indexOf(asnum.asnum)));
                                    });

                                    //focus.append("path")
                                    //    .datum(data)
                                    //    .attr("class", "area")
                                    //    .attr("d", area)
                                    //    .attr("fill",function(){return colors(i);});

                                    //focus.selectAll('.point').data(data).enter().append("circle")
                                    //focus.append("circle").datum(data)
                                    //    .attr("class","point graph"+asnum.asnum)
                                    //    .attr("cx",function(d){ console.log(d);return x(d.timestamp)})
                                    //    .attr("cy",function(d){return y(d.download_speed)})
                                    //    .attr("clip-path", "url(#clip)")
                                    //    .attr("r",circleSize)
                                    //    .attr("fill",function(){return colors(i);});

                                    focus.append("path")
                                        .datum(data)
                                        .attr("class", "line general-graph-" + asnum.asnum)
                                        .attr("d", line)
                                        .attr("clip-path", "url(#clip)")
                                        .attr("fill", "none")//,function(){return colors(i);})
                                        .attr("stroke", colors(colorMap.indexOf(asnum.asnum)))
                                        .style("stroke-dasharray", ("3, 3"));//"black");
                                });

                                //*/
                                //user data
                                /*
                                 focus.append("path")
                                 .datum(json)
                                 .attr("class", "area")
                                 .attr("d", area);
                                 */
                                //focus.selectAll('.point').data(json).enter().append("circle")
                                //focus.append("circle").datum(json)
                                //     .attr("class","point")
                                //     .attr("cx",function(d){ console.log(d);return x(d.timestamp)})
                                //     .attr("cy",function(d){return y(d.download_speed)})
                                //     .attr("clip-path", "url(#clip)")
                                //     .attr("r",circleSize);
                                userSplittedList.forEach(function (e) {
                                    e.downloads.forEach(function (ee) {
                                        ee.timestamp = new Date(ee.timestamp);
                                        focus.append("circle").datum(ee)
                                            .attr("class", "point user-graph-" + e.asnum)
                                            .attr("cx", function (d) {
                                                return x(d.timestamp)
                                            })
                                            .attr("cy", function (d) {
                                                return y(d.download_speed)
                                            })
                                            .attr("clip-path", "url(#clip)")
                                            .attr("isvisible", "true")
                                            .attr("ds", function (d) {
                                                return d.download_speed;
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
                                /*
                                 json.forEach(function(dd){
                                 focus.append("circle").datum(dd)
                                 .attr("class","point")
                                 .attr("cx",function(d){ console.log(d);return x(d.timestamp)})
                                 .attr("cy",function(d){return y(d.download_speed)})
                                 .attr("clip-path", "url(#clip)")
                                 .attr("r",circleSize);
                                 });
                                 focus.append("path")
                                 .datum(json)
                                 .attr("class","line")
                                 .attr("d",line)
                                 .attr("clip-path", "url(#clip)")
                                 .attr("fill","none")
                                 .attr("stroke","black");
                                 */
                                focus.append("g")
                                    .attr("class", "x axis")
                                    .attr("transform", "translate(0," + height + ")")
                                    .call(xAxis);

                                focus.append("g")
                                    .attr("class", "y axis")
                                    .call(yAxis);

                                //asnumList.forEach(function(asnum,i){
                                //    var data = asnum.downloadSpeeds;
                                //    context.append("path")
                                //        .datum(data)
                                //        .attr("class", "area graph"+asnum.asnum)
                                //        .attr("fill",function(){return colors(i);})
                                //        .attr("d", area2);
                                //});

                                context.append("path")
                                    .datum(json)
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

                                brush.extent([new Date("August 2015"), new Date("October 2015")]);
                                //context.select('.brush').call(brush);
                                //brushed();
                                d3.selectAll("path.domain").style("shape-rendering", "geometricPrecision");

                                //});

                                function brushed() {
                                    //x.domain(brush.empty() ? x2.domain() : brush.extent());
                                    //
                                    //focus.select(".area").attr("d", area);
                                    //focus.select(".line").attr("d", line);
                                    //focus.selectAll('.point')
                                    //	.attr("cx",function(d){ return x(d.timestamp)})
                                    //	.attr("cy",function(d){return y(d.download_speed)});
                                    //focus.select(".x.axis").call(xAxis);
                                    //// Reset zoom scale's domain
                                    //zoom.x(x);

                                    if (brush.empty()) {
                                        x.domain(x2.domain()); //reset the domain (Note the typo fix!)
                                    } else {
                                        var extent = brush.extent(); //returns [xMin, xMax]
                                        var width = extent[1] - extent[0]; //data-width = max - min
                                        //console.log("width: ->" + width);
                                        if (width < 86400000 * 7) {
                                            //console.log("#######prima######");
                                            //console.log(extent[1] + " - " + extent[0]);
                                            //console.log(width);
                                            //console.log("#############");
                                            var padding = (86400000 * 7 - width) / 2;
                                            //extent[0] -= padding;
                                            //extent[1] += padding;
                                            extent[0].setTime(parseInt(extent[0].getTime()) - padding);
                                            extent[1].setTime(parseInt(extent[1].getTime()) + padding);
                                            //console.log("#######dopo######");
                                            //console.log(extent[1] + " - " + extent[0]);
                                            //console.log(extent[0] + " - " + extent[1]);
                                            //console.log(padding);
                                            //console.log("#############");
                                            brush.extent(extent);
                                            svg.select(".brush").call(brush);
                                            //var rangeExtent = [x2( extent[0] ), x2( extent[1] ) ]; //convert
                                            //var rangeWidth  = rangeExtent[1] - rangeExtent[0];
                                            //console.log(rangeWidth);
                                            //d3.select(".extent").attr("width",rangeWidth);
                                            //return;
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
                                            return y(d.download_speed)
                                        });
                                    focus.select(".x.axis").call(xAxis);
                                    // Reset zoom scale's domain
                                    zoom.x(x);
                                }

                                function brushed2(brush, min, max) {
                                    return function () {
                                        var extent = brush.extent(),
                                            diff = extent[1] - extent[0];

                                        if (min && (diff < min)) {
                                            extent[1] = extent[0] + min;
                                        } else if (max && (diff > max)) {
                                            extent[1] = extent[0] + max;
                                        } else {
                                            return;
                                        }

                                        brush.extent(extent)(d3.select(this));
                                    }

                                }

                                function draw() {
                                    //console.log("<<<<<<<<<<<<"+ x.domain());
                                    //var extent = brush.extent(); //returns [xMin, xMax]
                                    //var width = extent[1] - extent[0]; //data-width = max - min
                                    //console.log("brush width: ->" + width);
                                    //if (width < 86400000*7) {
                                    //	var padding = (86400000*7 - width) / 2;
                                    //	extent[0].setTime(parseInt(extent[0].getTime())-padding);
                                    //	extent[1].setTime(parseInt(extent[1].getTime())+padding);
                                    //	//brush.extent(extent);
                                    //	x.domain(x.domain());
                                    //	brush.extent(x.domain());
                                    //	//svg.select(".brush").call(brush);
                                    //	return;
                                    //}
                                    focus.selectAll(".area").attr("d", area);
                                    focus.selectAll(".line").attr("d", line);
                                    focus.selectAll('.point')
                                        .attr("cx", function (d) {
                                            return x(d.timestamp)
                                        })
                                        .attr("cy", function (d) {
                                            return y(d.download_speed)
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
                                    //console.log("pane off left: " + $('.pane').offset().left);
                                    //console.log("pane off top: " + $('.pane').offset().top);
                                    // console.log("x: " + x + " y: " + y);
                                    var elements = $('.point').filter("[isvisible='true']").map(function () {
                                        var $this = $(this);
                                        var cx = parseInt($this.attr("cx"));
                                        var cy = parseInt($this.attr("cy"));
                                        var r = parseInt($this.attr("r"));

                                        if ((y <= cy + r && y >= cy - r) && (x <= cx + r && x >= cx - r)) {
                                            //console.log("TROVATO ");
                                            //console.log(this);
                                            //console.log("cx: " + cx + " cy: " + cy + " r: " + r);
                                            //console.log("x: " + x + " y: " + y);
                                            return $this;
                                        }
                                        //$('.pane').css('cursor', 'default');
                                        return null;
                                        //return (y <= cy + r && y >= cy - r) && (x <= cx + r && x >= cx - r) ? $this : null;

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
                                    scope.asnumDailyDownloads[i].downloadSpeeds.sort(function(a,b){return a.timestamp - b.timestamp;});
                                    //scope.asnumDailyDownloads[i].downloadSpeeds
                                    scope.asnumDailyDownloads[i].downloadSpeeds.forEach(function(ee){
                                        focus.append("circle").datum(ee)
                                            .attr("class", "point general-graph-" + newAsnum.asnum)
                                            .attr("cx", function (d) {return x(d.timestamp)})
                                            .attr("cy", function (d) {return y(d.download_speed)})
                                            .attr("clip-path", "url(#clip)")
                                            .attr("r", circleSize)
                                            .attr("isvisible", isVisible)
                                            .attr("ds", function (d) {return d.download_speed;})
                                            .attr("ts", function (d) {return formatTime(d.timestamp);})
                                            .attr("fill", colors(colorMap.indexOf(newAsnum.asnum)));
                                    });

                                    var index = colorMap.indexOf(scope.asnumDailyDownloads[i].asnum);
                                    console.log(scope.asnumDailyDownloads[i].downloadSpeeds);
                                    newLine = focus.append("path")
                                        .datum(scope.asnumDailyDownloads[i].downloadSpeeds)
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
                                        .attr("cy", function (d) {return y(d.download_speed);})
                                        .attr("clip-path", "url(#clip)")
                                        .attr("isvisible", isVisible)
                                        .attr("ds", function (d) {return d.download_speed;})
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
                });
            }
        }
    });
