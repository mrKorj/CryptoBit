const chartModule = function () {
    if (state.chartElement.length === 0) {
        $('#chartContainer').html('<h2 class="text-center">You must choose minimum one coin.</h2>')
    } else {
        const updateInterval = 2000;
        const time = new Date;
        const coins = state.chartElement.join(',');

        const chart = new CanvasJS.Chart("chartContainer", {
            zoomEnabled: true,
            exportEnabled: true,
            animationEnabled: true,
            title: {
                text: `${coins.toUpperCase()} to USD`,
                fontWeight: 'normal',
                fontSize: 25,
            },
            axisX: {
                title: "chart updates every 2 secs"
            },
            axisY: {
                title: "coin value",
                prefix: "$",
                includeZero: false
            },
            toolTip: {
                shared: true
            },
            legend: {
                cursor: "pointer",
                verticalAlign: "top",
                fontSize: 22,
                fontColor: "dimGrey",
                itemclick: toggleDataSeries
            },
            data: []
        });

        const yValue = [[], [], [], [], []];
        const points = [[], [], [], [], []];

        chart.options.data = state.chartElement.map((name, index) => {
            return {
                type: "line",
                xValueType: "dateTime",
                yValueFormatString: "$####.0000",
                xValueFormatString: "H:m:ss t",
                showInLegend: true,
                name: name,
                dataPoints: points[index]
            }
        });

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            chart.render();
        }

        function updateChart() {
            for (let i = 0; i < 1; i++) {
                time.setTime(time.getTime() + updateInterval);
                // pushing the new values
                points[0].push({
                    x: time.getTime(),
                    y: yValue[0]
                });
                points[1].push({
                    x: time.getTime(),
                    y: yValue[1]
                });
                points[2].push({
                    x: time.getTime(),
                    y: yValue[2]
                });
                points[3].push({
                    x: time.getTime(),
                    y: yValue[3]
                });
                points[4].push({
                    x: time.getTime(),
                    y: yValue[4]
                });
            }
            chart.render();
        }

        updateChart();
        state.intervalId = setInterval(() => {
            $.ajax(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins}&tsyms=USD`, {
                success: data => {
                    let temp = [];
                    for (let [key, value] of Object.entries(data)) {
                        console.log(key, value.USD);
                        temp.push(value.USD);
                    }
                    yValue[0] = temp[0];
                    yValue[1] = temp[1];
                    yValue[2] = temp[2];
                    yValue[3] = temp[3];
                    yValue[4] = temp[4];
                    updateChart()
                },
                error: (jqXHR, textStatus) => {
                    $('#chartContainer').html(`<h3 class="text-center text-danger">${jqXHR}, ${textStatus}</h3>`)
                }
            });
        }, updateInterval);
    }
};