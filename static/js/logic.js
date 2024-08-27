// Load and parse the CSV data
d3.csv("gini_heatmap/wii_data.csv").then(function(data) {

    // Nest the data by year
    let dataByYear = d3.group(data, d => d.year);

    // Generate the year dropdown options
    let yearSelect = document.getElementById('yearSelect');
    dataByYear.forEach((_, year) => {
        let option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelect.appendChild(option);
    });

    // Function to update the plot based on the selected year
    function updatePlot(year) {
        if (!year) return;

        let yearData = dataByYear.get(year);

        if (!yearData) {
            console.error(`No data found for year ${year}`);
            return;
        }

        // Access the columns (properties) for the selected year
        let countries = yearData.map(d => d.country);
        let gdps = yearData.map(d => +d.gdp);
        let gini = yearData.map(d => +d.gini_index);
        let population = yearData.map(d => +d.population);

        // Create hover text including the population
        let hoverText = yearData.map(d => `Country: ${d.country}<br>GDP: ${d.gdp} Billion USD<br>Gini Index: ${d.gini_index}<br>Population: ${d.population}`);

        let trace = {
            x: gdps,
            y: gini,
            text: hoverText,
            mode: 'markers',
            marker: {
                size: 12,
                color: "lightblue",
                line: {
                    width: 2
                }
            },
            hoverinfo: 'text'
        };

        let layout = {
            title: `GDP vs Gini Coefficient ${year}`,
            xaxis: {
                title: 'GDP (in Thousands (USD))'
            },
            yaxis: {
                title: 'Gini Coefficient'
            }
        };

        Plotly.newPlot('plotDiv', [trace], layout);
    }

    // Initialize plot with the first available year
    let initialYear = [...dataByYear.keys()][0];
    if (initialYear) {
        updatePlot(initialYear);
    }

    // Update plot when dropdown selection changes
    yearSelect.addEventListener('change', function() {
        updatePlot(this.value);
    });
});
