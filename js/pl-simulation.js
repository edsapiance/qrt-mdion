document.getElementById('simulateButton').addEventListener('click', simulatePL);

function simulatePL() {
    const years = parseInt(document.getElementById('yearsInput').value);
    const sharpeRatio = parseFloat(document.getElementById('sharpeInput').value);
    const yearlyMu = parseFloat(document.getElementById('muInput').value);

    const weeks = 52 * years;
    const yearlySigma = yearlyMu / sharpeRatio; // Derive sigma from mu and Sharpe ratio
    const weeklyMu = yearlyMu / 52;
    const weeklySigma = yearlySigma / Math.sqrt(52);

    let plValues = [{ x: new Date(), y: 0 }];
    let cumulativePL = 0;
    let currentDate = new Date();
    let weeklyReturns = [];
    let cumulativeMaxPL = 0; // Start cumulative max at zero to match the starting cumulative PL
    let maxPLValues = [{ x: new Date(), y: 0 }];
    let drawdownValues = [{ x: new Date(), y: 0 }];

    for (let i = 0; i < weeks; i++) {
        let epsilon = generateStandardNormal();  // Generate a standard normal random variable
        let weeklyReturn = weeklyMu + weeklySigma * epsilon;
        cumulativePL += weeklyReturn;
        cumulativeMaxPL = Math.max(cumulativeMaxPL, cumulativePL);
        
        currentDate.setDate(currentDate.getDate() + 7);

        plValues.push({
            x: new Date(currentDate),
            y: cumulativePL
        });
        maxPLValues.push({
            x: new Date(currentDate),
            y: cumulativeMaxPL
        });
        drawdownValues.push({
            x: new Date(currentDate),
            y: cumulativePL - cumulativeMaxPL  // Correct calculation of drawdown values
        });

        weeklyReturns.push(weeklyReturn);
    }

    drawChart(plValues, maxPLValues);
    drawDrawdownChart(drawdownValues);
    calculateStatistics(weeklyReturns);
    analyzeDrawdowns(drawdownValues);
}

function drawChart(plValues, maxPLValues) {
    const ctx = document.getElementById('equityCurve').getContext('2d');

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'PL Generation',
                    data: plValues,
                    borderColor: 'blue',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Cumulative Max PL',
                    data: maxPLValues,
                    borderColor: 'red',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative PL'
                    }
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function drawDrawdownChart(drawdownValues) {
    const ctx = document.getElementById('drawdownCurve').getContext('2d');

    if (window.drawdownChart) {
        window.drawdownChart.destroy();
    }

    window.drawdownChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Drawdown',
                    data: drawdownValues,
                    borderColor: 'green',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Drawdown'
                    }
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function calculateStatistics(weeklyReturns) {
    const n = weeklyReturns.length;
    const weeklyMu = weeklyReturns.reduce((acc, val) => acc + val, 0) / n;
    const weeklySigma = Math.sqrt(weeklyReturns.map(x => Math.pow(x - weeklyMu, 2)).reduce((a, b) => a + b) / n);

    const yearlyMu = weeklyMu * 52;
    const yearlySigma = weeklySigma * Math.sqrt(52);

    document.getElementById('weeklyMu').textContent = `Weekly Mu: $${weeklyMu.toFixed(0)}`;
    document.getElementById('weeklySigma').textContent = `Weekly Sigma: $${weeklySigma.toFixed(0)}`;
    document.getElementById('yearlyMu').textContent = `Yearly Mu: $${yearlyMu.toFixed(0)}`;
    document.getElementById('yearlySigma').textContent = `Yearly Sigma: $${yearlySigma.toFixed(0)}`;
}

function analyzeDrawdowns(drawdownValues) {
    let drawdowns = [];
    let currentDrawdown = null;
    let maxDrawdown = 0;
    let length = 0;

    for (let i = 0; i < drawdownValues.length; i++) {
        const value = drawdownValues[i].y;
        const date = drawdownValues[i].x;

        if (value === 0) {
            if (currentDrawdown) {
                currentDrawdown.end = date;
                drawdowns.push(currentDrawdown);
                currentDrawdown = null;
            }
            length = 0;
        } else {
            if (!currentDrawdown) {
                currentDrawdown = {
                    start: date,
                    max: Math.abs(value),
                    length: 0
                };
            }
            currentDrawdown.max = Math.max(currentDrawdown.max, Math.abs(value));
            length++;
            currentDrawdown.length = length;
        }
    }

    // Include the current drawdown if there is one
    if (currentDrawdown) {
        currentDrawdown.end = new Date(drawdownValues[drawdownValues.length - 1].x);
        drawdowns.push(currentDrawdown);
    }

    // Sort drawdowns by absolute value in descending order
    drawdowns.sort((a, b) => b.max - a.max);

    drawDrawdownAnalysisChart(drawdowns);
}

function drawDrawdownAnalysisChart(drawdowns) {
    const ctx = document.getElementById('drawdownAnalysisChart').getContext('2d');

    const data = drawdowns.map(dd => ({
        x: dd.length,
        y: dd.max
    }));

    if (window.drawdownAnalysisChart && typeof window.drawdownAnalysisChart.destroy === 'function') {
        window.drawdownAnalysisChart.destroy();
    }

    window.drawdownAnalysisChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Drawdown Analysis',
                data: data,
                borderColor: 'purple',
                borderWidth: 1,
                fill: false,
                pointRadius: 5
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of Weeks'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Drawdown Amplitude'
                    }
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function generateStandardNormal() {
    let u1 = Math.random();
    let u2 = Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0;
}
