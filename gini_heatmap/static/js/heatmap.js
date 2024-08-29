// Set the dimensions and margins of the map
const width = 800;  
const height = 500; 

// Append the SVG object to the body of the page for the map
const svgMap = d3.select("svg.map-background")
    .attr("width", width)
    .attr("height", height);

// Append the SVG object for the combined line chart
const svgCombinedLineChart = d3.select("#combined-line-chart")
    .attr("width", 500)
    .attr("height", 250);

// Append the SVG object for the scatter plot
const svgScatterPlot = d3.select("#scatter-plot")
    .attr("width", 500)  // Width remains the same for scatter plot
    .attr("height", 250);

// Map and projection
const projection = d3.geoMercator()
    .scale(100)  // Adjusted scale for smaller map size
    .translate([width / 2, height / 1.7]);

const path = d3.geoPath().projection(projection);

// Color schemes for different years
const colorSchemes = {
    2000: d3.interpolateBlues,
    2001: d3.interpolateGreens,
    2002: d3.interpolateOranges,
    2003: d3.interpolatePurples,
    2004: d3.interpolateReds,
    2005: d3.interpolateYlGnBu,
    2006: d3.interpolateYlOrBr,
    2007: d3.interpolateBuGn,
    2008: d3.interpolateBuPu,
    2009: d3.interpolateGnBu,
    2010: d3.interpolateOrRd,
    2011: d3.interpolatePuBu,
    2012: d3.interpolatePuBuGn,
    2013: d3.interpolateYlGn,
    2014: d3.interpolateRdPu,
    2015: d3.interpolateYlOrRd,
    2016: d3.interpolatePuRd,
    2017: d3.interpolateRdYlBu,
    2018: d3.interpolateRdYlGn,
    2019: d3.interpolateSpectral,
    2020: d3.interpolateRainbow
};

// Load external data and boot
Promise.all([
    d3.json("custom.geo.json"), // The GeoJSON file
    d3.csv("wii_data.csv")      // The CSV file containing Gini index, GDP, and Population data
]).then(function(data) {
    const geojson = data[0];
    const giniData = data[1];

    // Extract unique years from the data
    const years = [...new Set(giniData.map(d => d.year))];
    years.sort(); // Sort years in ascending order

    // Function to update the map based on the selected year
    function updateMap(selectedYear) {
        const giniByCountryName = {};
        const gdpByCountryName = {};
        const populationByCountryName = {};
        giniData.forEach(d => {
            if (d.year === selectedYear) {
                giniByCountryName[d.country] = +d.gini_index;
                gdpByCountryName[d.country] = +d.gdp;
                populationByCountryName[d.country] = +d.population; 
            }
        });

        // Update color scale based on the selected year's data
        const colorScale = d3.scaleSequential(colorSchemes[selectedYear])
            .domain([d3.min(giniData.filter(d => d.year === selectedYear), d => +d.gini_index),
                     d3.max(giniData.filter(d => d.year === selectedYear), d => +d.gini_index)]);

        // Update map colors
        svgMap.selectAll(".country")
            .data(geojson.features)
            .join("path")
            .attr("d", path)
            .attr("class", "country")
            .style("fill", function(d) {
                const gini = giniByCountryName[d.properties.name] || 0;
                return colorScale(gini);
            })
            .style("stroke", "#fff")
            .style("stroke-width", 0.8)
            .on("click", function(event, d) {
                const gini = giniByCountryName[d.properties.name];
                const gdp = gdpByCountryName[d.properties.name];
                const population = populationByCountryName[d.properties.name];

                if (gini !== undefined && gdp !== undefined && population !== undefined) {
                    // Get the centroid of the clicked country to position the tooltip
                    const [x, y] = path.centroid(d);

                    tooltip.html(`Country: ${d.properties.name}<br>Gini Index: ${gini.toFixed(2)}<br>GDP: ${gdp.toFixed(2)}<br>Population: ${population.toLocaleString()}`)
                        .style("left", `${x + 0}px`)  // Adjust x-position to be slightly to the right
                        .style("top", `${y - 0}px`)  // Adjust y-position to be slightly above
                        .style("visibility", "visible");

                    updateCombinedLineChart(d.properties.name); // Update combined line chart
                    highlightScatterPlotPoint(d.properties.name); // Highlight corresponding scatter plot point
                }
                svgMap.selectAll(".country").style("stroke", "#fff").style("stroke-width", 0.5); // Reset stroke for all
                d3.select(this).style("stroke", "black").style("stroke-width", 1); // Highlight selected country
            });

        // Update legend
        updateLegend(colorScale);
    }

    // Function to update the scatter plot
    function updateScatterPlot(selectedYear) {
        const scatterData = giniData.filter(d => d.year === selectedYear);
        
        const margin = {top: 10, right: 10, bottom: 40, left: 20};
        const scatterWidth = +svgScatterPlot.attr("width") - margin.left - margin.right;
        const scatterHeight = +svgScatterPlot.attr("height") - margin.top - margin.bottom;

        svgScatterPlot.selectAll("*").remove();

        const x = d3.scaleLinear()
            .domain([0, d3.max(scatterData, d => +d.gdp)]).nice()
            .range([margin.left, scatterWidth - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(scatterData, d => +d.gini_index)]).nice()
            .range([scatterHeight - margin.bottom, margin.top]);

        svgScatterPlot.append("g")
            .attr("transform", `translate(0,${scatterHeight - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6))
            .call(g => g.append("text")
                .attr("x", scatterWidth - margin.right)
                .attr("y", margin.bottom - 10)
                .attr("fill", "black")
                .attr("class", "axis-label")
                .text("GDP"));

        svgScatterPlot.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.append("text")
                .attr("x", -margin.left)
                .attr("y", margin.top - 10)
                .attr("fill", "none")
                .attr("text-anchor", "start")
                .attr("class", "axis-label")
                .text("Gini Index"));
        // Create tooltip for scatter plot
        const scatterTooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "8px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)");

        svgScatterPlot.selectAll("circle")
            .data(scatterData)
            .enter().append("circle")
            .attr("cx", d => x(+d.gdp))
            .attr("cy", d => y(+d.gini_index))
            .attr("r", 5)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1)
            .attr("class", d => `dot-${d.country.replace(/\s+/g, '')}`) // Add class for easier selection
            .on("mouseenter", function(event, d) {
                scatterTooltip.html(`Country: ${d.country}`)
                    .style("visibility", "visible")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseleave", function() {
                scatterTooltip.style("visibility", "hidden");
            })
            .on("click", function(event, d) {
                svgScatterPlot.selectAll("circle").attr("fill", "none").attr("r", 5); // Reset all dots
                d3.select(this).attr("fill", "orange").attr("r", 7); // Highlight the clicked dot
                tooltip.html(`Country: ${d.country}<br>Gini Index: ${d.gini_index.toFixed(2)}<br>GDP: ${d.gdp.toFixed(2)}`)
                    .style("visibility", "visible");
            });
    }

    // Function to highlight the corresponding scatter plot point
    function highlightScatterPlotPoint(countryName) {
        svgScatterPlot.selectAll("circle")
            .attr("stroke", "steelblue")
            .attr("fill", "none")  // Reset all dots
            .attr("r", 5); // Reset size

        svgScatterPlot.selectAll(`.dot-${countryName.replace(/\s+/g, '')}`)
            .attr("fill", "red")
            .attr("r", 10);  // Highlight and enlarge dot
    }

    // Function to update the combined line chart
    function updateCombinedLineChart(countryName) {
        const countryData = giniData.filter(d => d.country === countryName);
        if (countryData.length === 0) return;

        const margin = {top: 20, right: 10, bottom: 40, left: 20};
        const lineChartWidth = +svgCombinedLineChart.attr("width") - margin.left - margin.right;
        const lineChartHeight = +svgCombinedLineChart.attr("height") - margin.top - margin.bottom;

        svgCombinedLineChart.selectAll("*").remove();

        // Create scales for x, y1 (Gini), and y2 (GDP)
        const x = d3.scaleLinear()
            .domain(d3.extent(countryData, d => +d.year))
            .range([margin.left, lineChartWidth - margin.right]);

        const y1 = d3.scaleLinear()
            .domain([0, d3.max(countryData, d => +d.gini_index)]).nice()
            .range([lineChartHeight - margin.bottom, margin.top]);

        const y2 = d3.scaleLinear()
            .domain([0, d3.max(countryData, d => +d.gdp)]).nice()
            .range([lineChartHeight - margin.bottom, margin.top]);

        // Add x-axis
        svgCombinedLineChart.append("g")
            .attr("transform", `translate(0,${lineChartHeight - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")))
            .call(g => g.append("text")
                .attr("x", lineChartWidth - margin.right)
                .attr("y", margin.bottom - 10)
                .attr("fill", "black")
                .attr("class", "axis-label")
                .text("Year"));

        // Add y1-axis (Gini index)
        svgCombinedLineChart.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y1))
            .call(g => g.append("text")
                .attr("x", -margin.left)
                .attr("y", margin.top - 10)
                .attr("fill", "black")
                .attr("text-anchor", "start")
                .attr("class", "axis-label")
                .text("Gini Index"));

        // Add y2-axis (GDP)
        svgCombinedLineChart.append("g")
            .attr("transform", `translate(${lineChartWidth - margin.right},0)`)
            .call(d3.axisRight(y2))
            .call(g => g.append("text")
                .attr("x", margin.right - 40)
                .attr("y", margin.top - 10)
                .attr("fill", "black")
                .attr("text-anchor", "end")
                .attr("class", "axis-label")
                .text("GDP"));

        // Line for Gini index
        const lineGini = d3.line()
            .x(d => x(+d.year))
            .y(d => y1(+d.gini_index))
            .curve(d3.curveMonotoneX);

        // Line for GDP
        const lineGdp = d3.line()
            .x(d => x(+d.year))
            .y(d => y2(+d.gdp))
            .curve(d3.curveMonotoneX);

        // Draw Gini index line
        svgCombinedLineChart.append("path")
            .datum(countryData)
            .attr("fill", "none")
            .attr("stroke", "#1f77b4") // Color for Gini chart
            .attr("stroke-width", 2)
            .attr("d", lineGini);

        // Draw GDP line
        svgCombinedLineChart.append("path")
            .datum(countryData)
            .attr("fill", "none")
            .attr("stroke", "#ff7f0e")
            .attr("stroke-width", 2)
            .attr("d", lineGdp);

        // Title for the combined chart
        svgCombinedLineChart.append("text")
            .attr("x", (lineChartWidth + margin.left) / 2)
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text(`Gini Index and GDP Over Years for ${countryName}`);

        // Adding a legend to the line chart
        const legend = svgCombinedLineChart.append("g")
            .attr("transform", `translate(${lineChartWidth - 120},${lineChartHeight - 80})`); 

        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 10)
            .attr("r", 6)
            .style("fill", "#1f77b4");
        legend.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .text("Gini Index")
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");

        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 25)
            .attr("r", 6)
            .style("fill", "#ff7f0e");
        legend.append("text")
            .attr("x", 20)
            .attr("y", 25)
            .text("GDP")
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
    }

    // Tooltip for displaying Gini index, GDP, and Population
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)");

    // Function to update the map legend dynamically based on the color scale
    function updateLegend(colorScale) {
        svgMap.selectAll(".legend").remove();

        const legendWidth = 300;
        const legendHeight = 10;

        // Create a new legend group positioned at the top-left corner
        const legend = svgMap.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(10, 10)`);  // Position at the top-left corner

        // Define the gradient for the color scale
        const gradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "linear-gradient");

        gradient.selectAll("stop")
            .data(d3.range(0, 1.01, 0.01)) // Create a smooth gradient from 0 to 1
            .enter().append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => colorScale(d * colorScale.domain()[1])); // Adjust for dynamic range

        // Draw the gradient rectangle for the legend
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#linear-gradient)");

        // Add text label to the legend
        legend.append("text")
            .attr("class", "caption")
            .attr("x", legendWidth / 2)
            .attr("y", -6)
            .attr("text-anchor", "middle")
            .text("Gini Index");

        // Draw axis for the legend
        legend.call(d3.axisBottom(d3.scaleLinear()
            .domain(colorScale.domain())
            .range([0, legendWidth]))
            .ticks(5)
            .tickSize(-legendHeight));
    }

    // Initial map and scatter plot rendering
    updateMap(years[0]);
    updateScatterPlot(years[0]);

    // Update map and scatter plot when the year is changed
    d3.select("#yearSelector").on("change", function() {
        const selectedYear = this.value;
        updateMap(selectedYear);
        updateScatterPlot(selectedYear);
    });


}).catch(error => console.error('Error loading the data files:', error));

// Utility function for getting country values
function getValueForCountry(countryData) {
    // Implement logic to get value for a specific country based on the data
    return Math.random(); // Placeholder
}

document.addEventListener('DOMContentLoaded', function() {
    updateMap(document.getElementById('yearSelector').value);
    updateScatterPlot(document.getElementById('yearSelector').value);
});
