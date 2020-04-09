var movieArr = [];
var movieIntervalData = [];
const MINUTE = 5; 
const SIZE = 20; 

export function radii(movieMap) {
    // Select svg
    var main = d3.select('#main');
    var svg = d3.select('svg');
 	// Load tarantino wordcount dataset
    var wordDate = d3.csv('tarantino.csv').then(function(dataset) {
    	// Setup movie arrays 
        movieMap.forEach(element => movieArr.push(element))
        movieMap.forEach(element => {
        	// Calculate in interval 
        	var intervalData = [];
        	var intervalWords = [];
        	for (var i = 0; i < 180; i += MINUTE) {
        		// Get profanity in interval 
        		var start = i; 
        		var end = i+MINUTE; 
        		var counter = 0;
	        	var wordDict = {};
        		// Oh god this is so inefficient so if there's time we'll find a better way to do this 
        		for (var j = 0; j < dataset.length; j++) {
        			if (dataset[j].movie === element.title && dataset[j].minutes >= start && dataset[j].minutes < end) {
        				counter++;
        				if (dataset[j].word in wordDict === false) {
        					wordDict[dataset[j].word] = 1;
        				} else {
        					wordDict[dataset[j].word] += 1;
        				}
        			}
        		}
        		intervalData.push(counter);
        		intervalWords.push(wordDict);
        	}
        	movieIntervalData.push({"title": element.title, "intervalData": intervalData, "intervalWords": intervalWords});
        })
        console.log(movieIntervalData)

        // Setup Colors for Movies
        var color = ["#ff0000", "#ffa500", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#7f00ff"]

        // Setup Legend 
        createLegend(svg, movieArr, color);

	  	// For Each Movie: Make circle 
	  	var inner = SIZE;
	  	var outer = SIZE * 2;
	  	for (var i = 0; i < movieArr.length; i++) {
		    // Make circles based on data 
		    var arcInterval = new Array(); 	// 
		    for (var j = 0; j < 36; j++) {
		    	arcInterval.push(1);
		    }
			var data = movieIntervalData[i].intervalData;
			var wordData = movieIntervalData[i].intervalWords;

		    createArc(arcInterval, data, wordData, inner, outer, color[i], movieArr[i].duration);
		    inner += SIZE * 2; 
		    outer += SIZE * 2;
	  	}
    })	
}

function createLegend(svg, movieArr, colorArr) {
    svg.selectAll("dots")
      .data(movieArr)
      .enter()
      .append("circle")
        .attr("cx", 1100)
        .attr("cy", function(d,i){ return 100 + i*30}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 7)
        .style("fill", function(d, i){ return colorArr[i]})

    // Add one dot in the legend for each name.
    svg.selectAll("labels")
      .data(movieArr)
      .enter()
      .append("text")
        .attr("x", 1120)
        .attr("y", function(d,i){ return 100 + i*30}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d, i){ return colorArr[i]})
        .text(function(d){ return d.title})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
}

/**
* Creates arc for whichever movie data is passed in 
* arcInterval: Array used to set up the 180 / MINUTE (constant) minute intervals of the chart 
* data: Array of same length as arcInterval. Values contain number of profanity used in each interval.
* 		Used to calculate color affected by intensity 
* innerRadius: Inner radius size of arc
* outerRadius: Outer radius size of arc
*/
function createArc(arcInterval, data, wordData, innerRadius, outerRadius, color, movieLength) {
	var svg = d3.select("svg");
    var width = window.innerWidth || document.body.clientWidth;  //svg.attr("width");
    width *= .9;
    var height = window.innerHeight || document.body.clientHeight; //svg.attr("height");
    height *= .9;
    var radius = Math.min(width, height) / 4;
    var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Generate the pie
    var pie = d3.pie();

    // Generate the arcs
    var arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    // Make tooltip
    var toolTip = d3.select('body').append('div')
    			.attr('class', 'tooltip-profanity')
    			.style('opacity', 0);

    //Generate groups
    var arcs = g.selectAll("arc")
                .data(pie(arcInterval))
                .enter()
                .append("g")
                .attr("class", "arc")
                .on('mouseover', function (d, i) {
                	d3.select(this).transition()
                		.duration('50')
                		.attr('opacity', '0.85');
                	if (i >= movieLength / MINUTE) {
                		toolTip.transition()
	                		.duration('50')
	                		.style('opacity', 0);
                	} else {	
	                	toolTip.transition()
	                		.duration('50')
	                		.style('opacity', 1);
	                	if (Object.keys(wordData[i].length !== 0)) {
                			var highestVal = Math.max.apply(null, Object.values(wordData[i]))
		                	var mostUsed = Object.keys(wordData[i]).find(function(a) {
		                		return wordData[i][a] === highestVal;
		                	})
		                	if (mostUsed === '') {
		                		mostUsed = 'Death';
		                	} else if (typeof mostUsed === 'undefined') {
		                		mostUsed = 'N/A';
		                	}
		                	toolTip.html('Most Common Profanity: '.bold() + mostUsed + '<br>'
		                		+ 'Total Profanity: '.bold() + data[i])
		                		.style('left', (d3.event.pageX + 10) + 'px')
		                		.style('top', (d3.event.pageY - 15) + 'px');
		                }
                	}
                })
                .on('mouseout', function (d, i) {
                	d3.select(this).transition()
                		.duration('50')
                		.attr('opacity', '1');
                	toolTip.transition()
                		.duration('50')
                		.style('opacity', 0);
                });

    //Draw arc paths (separating intervals)
    arcs.append("path")
        .attr("fill", function(d, i) {
        	return i < movieLength / MINUTE ? getColor(color, 18, data[i]) : "#000000"
        })
        .attr("d", arc);
}

/**
* Gets color based on the ratio between current interval's profanity and total profanity 
* base: Base color 
* total: Total number of profanity in movie 
* current: Number of profanity in current interval 
*/
function getColor(base, total, current) {
	var c = d3.hsl(base);
	c.s = current / total;
	return c; 
}