// Set the dimensions and margins of the map
const width = 900;
const height = 650;

// Append the SVG object to the body of the page for the map
const svgMap = d3.select("svg.map-background")
    .attr("width", width)
    .attr("height", height - 10);

// Append the SVG object for the Gini index line chart
const svgGiniChart = d3.select("#gini-chart")
    .attr("width", 500)
    .attr("height", 300);

// Append the SVG object for the GDP line chart
const svgGdpChart = d3.select("#gdp-chart")
    .attr("width", 500)
    .attr("height", 300);

// Map and projection
const projection = d3.geoMercator()
    .scale(130)
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

    // Create dropdown menu for year selection
    const yearSelector = d3.select("#yearSelector");
    yearSelector.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Initial year selection
    const initialYear = years[0];
    yearSelector.property("value", initialYear);

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
            .on("mouseover", function(event, d) {
                const gini = giniByCountryName[d.properties.name];
                const gdp = gdpByCountryName[d.properties.name];
                const population = populationByCountryName[d.properties.name];

                if (gini !== undefined && gdp !== undefined && population !== undefined) {
                    tooltip.html(`Country: ${d.properties.name}<br>Gini Index: ${gini.toFixed(2)}<br>GDP: ${gdp.toFixed(2)}<br>Population: ${population.toLocaleString()}`)
                        .style("visibility", "visible");
                    updateGiniLineChart(d.properties.name);
                    updateGdpLineChart(d.properties.name);
                }
                d3.select(this).style("stroke", "black").style("stroke-width", 1);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
                d3.select(this).style("stroke", "#fff").style("stroke-width", 0.5);
                svgGiniChart.selectAll("*").remove();
                svgGdpChart.selectAll("*").remove();
            });

        // Update legend
        updateLegend(colorScale);
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

    // Function to update the legend dynamically based on the color scale
    function updateLegend(colorScale) {
        svgMap.selectAll(".legend").remove(); // Remove existing legend

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

    // Function to update Gini index line chart
    function updateGiniLineChart(countryName) {
        const countryData = giniData.filter(d => d.country === countryName);
        if (countryData.length === 0) return;

        const margin = {top: 20, right: 30, bottom: 40, left: 50};
        const lineChartWidth = +svgGiniChart.attr("width") - margin.left - margin.right;
        const lineChartHeight = +svgGiniChart.attr("height") - margin.top - margin.bottom;

        svgGiniChart.selectAll("*").remove();

        const x = d3.scaleLinear()
            .domain(d3.extent(countryData, d => +d.year))
            .range([margin.left, lineChartWidth - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(countryData, d => +d.gini_index)]).nice()
            .range([lineChartHeight - margin.bottom, margin.top]);

        // Add gridlines
        svgGiniChart.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${lineChartHeight - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickSize(-lineChartHeight + margin.top + margin.bottom).tickFormat(''))
            .selectAll("line")
            .style("stroke", "lightgrey");

        svgGiniChart.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickSize(-lineChartWidth + margin.left + margin.right).tickFormat(''))
            .selectAll("line")
            .style("stroke", "lightgrey");

        const line = d3.line()
            .x(d => x(+d.year))
            .y(d => y(+d.gini_index))
            .curve(d3.curveMonotoneX); // Smoother line

        const xAxis = g => g
            .attr("transform", `translate(0,${lineChartHeight - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")))
            .call(g => g.append("text")
                .attr("x", lineChartWidth - margin.right)
                .attr("y", margin.bottom - 10)
                .attr("fill", "black")
                .attr("class", "axis-label")
                .text("Year"));

        const yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.append("text")
                .attr("x", -margin.left)
                .attr("y", margin.top - 10)
                .attr("fill", "black")
                .attr("text-anchor", "start")
                .attr("class", "axis-label")
                .text("Gini Index"));

        svgGiniChart.append("g")
            .call(xAxis);

        svgGiniChart.append("g")
            .call(yAxis);

        svgGiniChart.append("path")
            .datum(countryData)
            .attr("fill", "none")
            .attr("stroke", "#1f77b4") // Different color for Gini chart
            .attr("stroke-width", 2)
            .attr("d", line);

        svgGiniChart.append("text")
            .attr("x", (lineChartWidth + margin.left) / 2)
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`Gini Index Over Years for ${countryName}`);
    }

    // Function to update GDP line chart
    function updateGdpLineChart(countryName) {
        const countryData = giniData.filter(d => d.country === countryName);
        if (countryData.length === 0) return;

        const margin = {top: 20, right: 30, bottom: 40, left: 50};
        const lineChartWidth = +svgGdpChart.attr("width") - margin.left - margin.right;
        const lineChartHeight = +svgGdpChart.attr("height") - margin.top - margin.bottom;

        svgGdpChart.selectAll("*").remove();

        const x = d3.scaleLinear()
            .domain(d3.extent(countryData, d => +d.year))
            .range([margin.left, lineChartWidth - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(countryData, d => +d.gdp)]).nice()
            .range([lineChartHeight - margin.bottom, margin.top]);

        // Add gridlines
        svgGdpChart.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${lineChartHeight - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickSize(-lineChartHeight + margin.top + margin.bottom).tickFormat(''))
            .selectAll("line")
            .style("stroke", "lightgrey");

        svgGdpChart.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickSize(-lineChartWidth + margin.left + margin.right).tickFormat(''))
            .selectAll("line")
            .style("stroke", "lightgrey");

        const line = d3.line()
            .x(d => x(+d.year))
            .y(d => y(+d.gdp))
            .curve(d3.curveMonotoneX); // Smoother line

        const xAxis = g => g
            .attr("transform", `translate(0,${lineChartHeight - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")))
            .call(g => g.append("text")
                .attr("x", lineChartWidth - margin.right)
                .attr("y", margin.bottom - 10)
                .attr("fill", "black")
                .attr("class", "axis-label")
                .text("Year"));

        const yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.append("text")
                .attr("x", -margin.left)
                .attr("y", margin.top - 5)
                .attr("fill", "black")
                .attr("text-anchor", "start")
                .attr("class", "axis-label")
                .text("GDP"));

        svgGdpChart.append("g")
            .call(xAxis);

        svgGdpChart.append("g")
            .call(yAxis);

        svgGdpChart.append("path")
            .datum(countryData)
            .attr("fill", "none")
            .attr("stroke", "#ff7f0e") // Different color for GDP chart
            .attr("stroke-width", 2)
            .attr("d", line);

        svgGdpChart.append("text")
            .attr("x", (lineChartWidth + margin.left) / 2)
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`GDP Over Years for ${countryName}`);
    }

    // Initial map rendering
    updateMap(initialYear);

    // Update map when the year is changed
    yearSelector.on("change", function() {
        const selectedYear = this.value;
        updateMap(selectedYear);
    });

}).catch(error => console.error('Error loading the data files:', error));

// Utility function for getting country values
function getValueForCountry(countryData) {
    // Implement logic to get value for a specific country based on the data
    return Math.random(); // Placeholder
}

document.addEventListener('DOMContentLoaded', function() {
    updateMap(document.getElementById('yearSelector').value);
});
