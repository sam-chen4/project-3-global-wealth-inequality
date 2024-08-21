// Load and parse the JSON data
d3.json("Resources/data.json").then(function(data) {

    // Access the columns (properties)
    let countries = data.map(d => d.country);
    let gdp_2018 = data.map(d => d.gdp_2018);
    let gini_2018 = data.map(d => d.gini_std_2018);
    let gdp_2022 = data.map(d => d.gdp_2022);
    let gini_2022 = data.map(d => d.gini_std_2022);

    function updatePlot(year) {
        let xData, yData;
        if (year === "2018") {
            xData = gdp_2018;
            yData = gini_2018;
        } else {
            xData = gdp_2022;
            yData = gini_2022;
        }

        let trace = {
            x: xData,
            y: yData,
            text: countries,
            mode: 'markers',
            marker: {
                size: 12,
                color: 'rgba(93, 164, 214, 0.8)',
                line: {
                    width: 2
                }
            }
        };

        let layout = {
            title: `GDP vs Gini Coefficient ${year}`,
            xaxis: {
                title: 'GDP (in Billion USD)'
            },
            yaxis: {
                title: 'Gini Coefficient'
            }
        };

        Plotly.newPlot('plotDiv', [trace], layout);
    }

    // Initialize plot with 2018 data
    updatePlot("2018");

    // Update plot when dropdown selection changes
    document.getElementById('yearSelect').addEventListener('change', function() {
        updatePlot(this.value);
    });
});
