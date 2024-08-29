let dataByYear = {};

d3.csv("Resources/wii_data_with_continents.csv").then(function(data) {
    // Process data by year
    data.forEach(d => {
        if (!dataByYear[d.year]) {
            dataByYear[d.year] = [];
        }
        dataByYear[d.year].push(d);
    });

    console.log("Data by Year:", dataByYear); // Ensure data is loaded

    // Initialize charts
    const ctxGdp = document.getElementById('gdpChart').getContext('2d');
    const ctxGini = document.getElementById('giniChart').getContext('2d');
    
    let gdpChart = createChart(ctxGdp, 'GDP by Continent', []);
    let giniChart = createChart(ctxGini, 'Gini Coefficient by Continent', []);

    // Update charts when the year changes
    yearSelect.addEventListener('change', function() {
        const selectedYear = this.value;
        updateCharts(selectedYear, gdpChart, giniChart);
    });

    // Initially load the first year's data
    const initialYear = yearSelect.value || Object.keys(dataByYear)[0];
    yearSelect.value = initialYear;
    updateCharts(initialYear, gdpChart, giniChart);
}).catch(function(error) {
    console.error("Error loading or processing data:", error);
});

function createChart(ctx, title, data) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Will be set in updateCharts
            datasets: [{
                barPercentage: 0.7,
                barThickness: 30,
                minBarLength: 2,
                categoryPercentage: 0.2,
                label: title,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: "y",
            scales: {
                y: {
                    beginAtZero: true,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                }
            }
        }
    });
}

function generateColors(count) {
    const colors = [];
    const colorPalette = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF5', '#F5FF33', '#A133FF', '#FF8F33', '#33FF8F', '#8F33FF'];
    for (let i = 0; i < count; i++) {
        colors.push(colorPalette[i % colorPalette.length]);
    }
    return colors;
}

function updateCharts(year, gdpChart, giniChart) {
    const data = dataByYear[year];

    if (!data) {
        console.error("No data available for the selected year:", year);
        return;
    }

    const continents = {};
    data.forEach(d => {
        if (!continents[d.continent]) {
            continents[d.continent] = { gdp: 0, gini: 0, count: 0 };
        }
        continents[d.continent].gdp += parseFloat(d.gdp) || 0;
        continents[d.continent].gini += parseFloat(d.gini_index) || 0;
        continents[d.continent].count += 1;
    });

    const labels = Object.keys(continents);
    const avgGdp = labels.map(cont => continents[cont].gdp / continents[cont].count);
    const avgGini = labels.map(cont => continents[cont].gini / continents[cont].count);

    // Define color mappings for each continent
    const colorMapping = {
        'Africa': { fill: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
        'Asia': { fill: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
        'Europe': { fill: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
        'North America': { fill: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
        'Oceania': { fill: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' },
        'South America': { fill: 'rgba(255, 159, 64, 0.2)', border: 'rgba(255, 159, 64, 1)' }
    };

    // Update GDP chart
    gdpChart.data.labels = labels;
    gdpChart.data.datasets[0].data = avgGdp;
    gdpChart.data.datasets[0].backgroundColor = labels.map(cont => colorMapping[cont]?.fill || 'rgba(0, 0, 0, 0.1)');
    gdpChart.data.datasets[0].borderColor = labels.map(cont => colorMapping[cont]?.border || 'rgba(0, 0, 0, 0.5)');
    gdpChart.update();

    // Update Gini chart
    giniChart.data.labels = labels;
    giniChart.data.datasets[0].data = avgGini;
    giniChart.data.datasets[0].backgroundColor = labels.map(cont => colorMapping[cont]?.fill || 'rgba(0, 0, 0, 0.1)');
    giniChart.data.datasets[0].borderColor = labels.map(cont => colorMapping[cont]?.border || 'rgba(0, 0, 0, 0.5)');
    giniChart.update();
}
