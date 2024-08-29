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

    // Function to get color based on year
    function getColorForYear(year) {
        const colorMap = {
            2000: "rgba(0, 0, 255, 0.4)", 
            2001: "rgba(0, 128, 0, 0.4)", 
            2002: "rgba(128, 0, 128, 0.4)", 
            2003: "rgba(0, 0, 255, 0.4)",
            2004: "rgba(255, 0, 255, 0.4)",  
            2005: "rgba(165, 42, 42, 0.4)",
            2006: "rgba(0, 128, 128, 0.4)",
            2007: "rgba(47, 79, 79, 0.4)",
            2008: "rgba(165, 42, 42, 0.4)",
            2009: "rgba(120, 81, 169, 0.6)",
            2010: "rgba(0, 128, 0, 0.4)",
            2011: "rgba(255, 0, 255, 0.4)",
            2012: "rgba(255, 165, 0, 0.4)",
            2013: "rgba(0, 0, 0, 0.4)",
            2014: "rgba(255, 0, 0, 0.4)",
            2015: "rgba(0, 139, 139, 0.4)",
            2016: "rgba(255, 0, 0, 0.4)",
            2017: "rgba(154, 205, 50, 0.7)",
            2018: "rgba(48, 25, 52, 0.4)",
            2019: "rgba(64, 224, 208, 0.7)",
            2020: "rgba(0, 139, 139, 0.4)"
        };

        // Return color for the year or a default color if not defined
        return colorMap[year] || 'rgba(0, 0, 0, 0.5)'; // Default to black
    }

    // Function to update the plot based on the selected year
    function updatePlot(year) {
        if (!year) return;

        let yearData = dataByYear.get(year);

        if (!yearData) {
            console.error(`No data found for year ${year}`);
            return;
        }

        // Access the columns (properties) for the selected year
        let dataPoints = yearData.map(d => ({
            x: +d.gdp,
            y: +d.gini_index,
            label: d.country
        }));

        // Get the color for the selected year
        let color = getColorForYear(year);

        // Create or update the chart with Chart.js
        if (window.scatterChart) {
            window.scatterChart.data.datasets[0].data = dataPoints;
            window.scatterChart.data.datasets[0].backgroundColor = color;
            window.scatterChart.data.datasets[0].borderColor = color.replace('0.5', '1');
            window.scatterChart.update();
        } else {
            let ctx = document.getElementById('scatterPlot').getContext('2d');
            window.scatterChart = new Chart(ctx, {
                type: "scatter",
                data: {
                    datasets: [{
                        label: 'GDP vs Gini Coefficient',
                        data: dataPoints,
                        backgroundColor: color,
                        borderColor: color.replace('0.5', '1'),
                        borderWidth: 1,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let data = context.raw;
                                    return `Country: ${data.label}\nGDP: ${data.x} USD\nGini Index: ${data.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'GDP (in Thousands (USD))'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Gini Coefficient'
                            }
                        }
                    }
                }
            });
        }
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