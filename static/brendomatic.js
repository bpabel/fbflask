


// Utility functions.

function updateFeedGraph() {
    mybrendomatic.getMoreFeedData();
}

function getRandomColor(alpha) {
    alpha = typeof(alpha) !== 'undefined' ? alpha : 1;
    var color = 'rgba(';
    color += Math.floor(Math.random() * 255).toString();
    color += "," + Math.floor(Math.random() * 255).toString();
    color += "," + Math.floor(Math.random() * 255).toString();
    color += "," + alpha.toString() + ")";
    return color;
}

// Brendomatic class methods
function getFacebookData() {
    var this_ = this;
    FB.api('me/tagged_places', function(response){ this_.handleTaggedPlacesResponse(response); });
    FB.api('me/feed', function(response){ this_.handleFeedResponse(response); });
}


function getMoreFeedData() {
    if (this.posts_next_page) {
        this.posts_next_lim = 3;
        var this_ = this;
        FB.api(this.posts_next_page, function(response){ this_.handleFeedResponse(response); });
    }
}


function handleFeedResponse(response) {

    if (this.posts === null) {
        this.posts_next_lim = 0;
        this.posts = [];
    }
    

    this.posts.push.apply(this.posts, response.data);

    this.posts_next_page = response.paging ? response.paging.next: null;
 
    // Look for additional pages.  Get all tagged Places.
    if (response.data.length > 0 && response.paging && response.paging.next && this.posts_next_cntr < this.posts_next_lim) {
        var this_ = this;
        this.posts_next_cntr++;
        FB.api(this.posts_next_page, function(response){ this_.handleFeedResponse(response); });
    } else {
        this.posts_next_cntr = 0;
        this.graphPosts(); 
    }
   
}


function handleTaggedPlacesResponse(response) {

    // Update tagged city data counts.
    for (var i=0; i<response.data.length; i++) {
        var tagged_place = response.data[i]
        if (tagged_place.place && tagged_place.place.location && tagged_place.place.location.city) {
            var city = tagged_place.place.location.city
            if (tagged_place.place.location.state) {
                city = city.concat(", " + tagged_place.place.location.state)
            }
            if (city in this.tagged_city_data) {
                this.tagged_city_data[city]++;
            } else {
                this.tagged_city_data[city] = 1;
            }
        }
    }
    
    // Look for additional pages.  Get all tagged Places.
    if (response.data.length > 0 && response.paging && response.paging.next && response.paging.cursors.after) {
        FB.api('me/tagged_places', {'after': response.paging.cursors.after}, this.handleTaggedPlacesResponse);
    } else {
        this.graphTaggedPlaces(); 
   }
}



function createGraphDiv(graph_id, chart_id, title, legend_title, recreate, height, width) {

    var recreate = recreate === undefined ? true : recreate;
    var height = height === undefined ? 400 : height;
    var width = width === undefined ? 400 : width;

    var check = document.querySelector(".graphs .graph#" + graph_id);
    if (check !== null) {
        if (recreate) {
            check.remove();
        } else {
            return null;
        }
    }

    var graphs = document.querySelector(".graphs");
    
    var graph = document.createElement("div");
    graph.className = "graph";
    graph.id = graph_id;
    graphs.appendChild(graph);
    
    var gtitle = document.createElement("div");
    gtitle.className = "graph_title";
    gtitle.innerText = title;
    graph.appendChild(gtitle);

    var gdata = document.createElement("div");
    gdata.className = "graph_data";
    gdata.style.width = width.toString() + 'px';
    graph.appendChild(gdata);

    var cholder = document.createElement("div");
    cholder.className = "chart_holder";
    gdata.appendChild(cholder);

    var canvas = document.createElement("canvas");
    canvas.id = chart_id;
    canvas.width = width;
    canvas.height = height;
    cholder.appendChild(canvas);

    var clegend = document.createElement("div");
    clegend.className = "chart_legend";
    gdata.appendChild(clegend);

    var ltitle = document.createElement("div");
    ltitle.className = "legend_title";
    ltitle.innerText = legend_title;
    clegend.appendChild(ltitle);
    
    var lscale = document.createElement("div");
    lscale.className = "legend_scale";
    clegend.appendChild(lscale);

    var llabels = document.createElement("ul");
    llabels.className = "legend_labels";
    lscale.appendChild(llabels);


}


function graphPosts() {

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    //var times = ["12am", "1", "2", "3", "4", "5", "6" "7", "8", "9", "10", "11", "12pm", "1", "2", "3", "4", "5", "6" "7", "8", "9", "10", "11"];

    var year_map = {};

    for (var i=0; i<this.posts.length; i++) {
        var post = this.posts[i];
        var m = post.created_time.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
        if (m) {
            var year = m[1];
            if (!(year in year_map)) {
                year_map[year] = {};
            }

            var month = Number(m[2]);
            if (!(month in year_map[year])) {
                year_map[year][month] = 1;
            } else {
                year_map[year][month]++;
            }
        }
    }

    var datasets = []

    // Convert map to a list of pairs.
    var yearsdata = Object.keys(year_map).map(function(year){
        return [year, year_map[year]];
    });

    // Sort by year.
    yearsdata.sort(function(a,b){ return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;})
    yearsdata.reverse();

    for (var i=0; i<yearsdata.length; i++) {
        var year = yearsdata[i][0];
        var yeardata = yearsdata[i][1];
        var data = [];

        for (var j=1; j<13; j++) {
            if (j in yeardata) {
                data.push(yeardata[j]);
            } else {
                data.push(0);
            }
        }

        var color = getRandomColor();
        var fillcolor = color.replace(",1)", ",0.2)");

        datasets.push({
            label: year,
            fillColor: fillcolor,
            strokeColor: color,
            pointColor: color,
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: color,
            data: data
        });


    }

    var chart_data = {
        labels: months,
        datasets: datasets
    }

    // Check to see if the graph already exists. If so, pull colors from it.
    if (this.chart_posts != null) {

        for (var i=0; i<datasets.length; i++) {
            var dataset = datasets[i];
            var found = false;

            for (var j=0; j<this.chart_posts.datasets.length; j++) {
                var chart_dataset = this.chart_posts.datasets[j];

                if (dataset.label == chart_dataset.label) {

                    // Update Existing series values
                    dataset.fillColor = chart_dataset.fillColor;
                    dataset.strokeColor = chart_dataset.strokeColor;
                    dataset.pointColor = chart_dataset.pointColor;
                    dataset.pointHighlightStroke = chart_dataset.strokeColor;
                    found = true
                }
            }

        }

    }

    // Draw graph.
    createGraphDiv("graph-posts", "chart-posts", "Post Activity", "Year", true, 400, 600);
    var ctx = document.getElementById("chart-posts").getContext("2d");
    var mychart = new Chart(ctx).Line(chart_data);   
    this.chart_posts = mychart;

    if (this.posts_next_page != null) {
        var graph = document.querySelector(".graphs .graph#graph-posts")
        var button = document.createElement("button");
        button.innerText = "Load More";
        button.setAttribute("onclick", "updateFeedGraph()");
        graph.appendChild(button);
    }

    // Create legend for graph.
    var legend = document.querySelector(".graphs .graph#graph-posts .legend_labels");
    while (legend.lastChild) {
        legend.removeChild(legend.lastChild);
    }
    
    for (var i=0; i<datasets.length; i++) {
        var d = datasets[i];
        var li = document.createElement('li')
        var elem = document.createElement("span");
        var txt = document.createTextNode(d.label);
        legend.appendChild(li);
        li.appendChild(elem);
        li.appendChild(txt);
        elem.style.background = d.strokeColor;
    }

}


function graphTaggedPlaces() {
    var this_ = this;

    // Convert map to a list of pairs.
    var data = Object.keys(this_.tagged_city_data).map(function(key){
        return [key, this_.tagged_city_data[key]];
    });

    // Sort pairs based on city.
    data.sort(function(a,b){
        // Sort by state first, then city name.
        al = a[0].split(", ");
        bl = b[0].split(", ");
        return [al[1], al[0]] < [bl[1], bl[0]] ? -1 : [al[1], al[0]] > [bl[1], bl[0]] ? 1 : 0;
    })

    // Setup data and options for chartjs
    var chart_data = []
    for (var i=0; i<data.length; i++) {
        chart_data.push({
            label: data[i][0],
            value: data[i][1],
            color: getRandomColor()
        })
    }
    Chart.defaults.global.responsive = true;

    var options = {
        legendTemplate: ""
    };

    // Create div and canvas for graph.
    createGraphDiv("graph-taggedplaces", "chart-taggedplaces", "Tagged Places", "City");

    // Draw graph.
    var ctx = document.getElementById("chart-taggedplaces").getContext("2d");
    var mychart = new Chart(ctx).Pie(chart_data);   
    this.chart_taggedplaces = mychart;
    
    // Create legend for graph.
    var legend = document.querySelector(".graphs .graph#graph-taggedplaces .legend_labels");
    while (legend.lastChild) {
        legend.removeChild(legend.lastChild);
    }
    
    for (var i=0; i<chart_data.length; i++) {
        var ed = chart_data[i];
        var li = document.createElement('li')
        var elem = document.createElement("span");
        var txt = document.createTextNode(ed.label);
        legend.appendChild(li);
        li.appendChild(elem);
        li.appendChild(txt);

        elem.style.background = ed.color;

    }
}


// Brendomatic class.  Gathers facebook data and graphs it.
function Brendomatic() {
    this.tagged_city_data = {};
    this.posts = null;
    this.posts_next_page = null;
    this.posts_next_cntr = 0;
    this.posts_next_lim = 1;
    this.chart_taggedplaces = null;
    this.chart_posts = null;
}


Brendomatic.prototype = {
    constructor: Brendomatic,
    getFacebookData: getFacebookData,
    handleTaggedPlacesResponse: handleTaggedPlacesResponse,
    graphTaggedPlaces: graphTaggedPlaces,
    handleFeedResponse: handleFeedResponse,
    graphPosts: graphPosts,
    getMoreFeedData: getMoreFeedData,
}








