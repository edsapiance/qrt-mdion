

function parseDate(excelDate) {
    // Excel date format to JavaScript Date object
    const date = new Date((excelDate - (25567 + 1)) * 86400 * 1000);
    return date;
}

function plotData() {
    if (realizedData.length === 0 || theoreticalData.length === 0) {
        return; // Ensure both datasets are loaded
    }

    const labels = realizedData.map(d => d.date);
    const realizedPL = realizedData.map(d => d.pl);
    const theoreticalPL = theoreticalData.map(d => d.pl);

    const ctx = document.getElementById('synchronizedPLChart').getContext('2d');

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Realized PL',
                    data: realizedPL,
                    borderColor: 'blue',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Theoretical PL',
                    data: theoreticalPL,
                    borderColor: 'green',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM dd, yyyy',
                        displayFormats: {
                            day: 'MMM dd, yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'PL Value'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy'
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });
}

