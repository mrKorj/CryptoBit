const chartModule = function () {
    if (state.chartElement.length === 0) {
        $('#chartContainer').html('<h2 class="text-center">You must choose minimum one coin.</h2>')
    } else {
        const updateInterval = 3000;
        const coins = state.chartElement.join(',');
        const chart = new CanvasJS.Chart("chartContainer", {
            zoomEnabled: true,
            exportEnabled: true,
            animationEnabled: true,
            title: {
                text: `${coins.toUpperCase()} to USD`,
                fontWeight: 'normal',
                fontSize: 25
            },
            axisX: {
                title: "chart updates every 3 secs",
                valueFormatString: "HH:mm:ss"
            },
            axisY: {
                title: "coin value",
                includeZero: false,
                suffix: " $"
            },
            legend: {
                cursor: "pointer",
                verticalAlign: "top",
                fontSize: 22,
                itemclick: toggleDataSeries
            },
            toolTip: {
                shared: true
            },
            data: []
        });
        chart.render();

        chart.options.data = state.chartElement.map((name, index) => {
            return {
                name: name,
                type: "spline",
                yValueFormatString: "$####.0000",
                showInLegend: true,
                dataPoints: []
            }
        });

        state.intervalId = setInterval(() => {
            $.ajax(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins}&tsyms=USD`, {
                success: data => {
                    const temp = [];
                    for (let [key, value] of Object.entries(data)) {
                        console.log(key, value.USD);
                        temp.push(value.USD);
                    }
                    temp.forEach((value, index) => {
                        chart.options.data[index].dataPoints.push({x: new Date(), y: value});
                    })
                    chart.render()
                },
                error: (jqXHR, textStatus) => {
                    $('#chartContainer').html(`<h3 class="text-center text-danger">${jqXHR}, ${textStatus}</h3>`)
                }
            });
        }, updateInterval);


        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            chart.render();
        }
    }
}




