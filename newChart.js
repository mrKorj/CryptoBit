const chartModule = function () {
    $ELEMENTS.chartContainer.html(`
            <div class="text-center d-flex justify-content-center p-5 text-primary">
                <h3 class="m-4">Loading...</h3>
                <div class="spinner-border m-2" style="width: 3rem; height: 3rem;" role="status"></div>
            </div>`);

    const newCoinsList = [];
    const coins = state.chartElement.join(',');

    if (state.chartElement.length === 0) {
        $ELEMENTS.chartContainer.html('<h4 class="text-center">You must choose minimum one coin.</h4>')
    } else {
        $.ajax(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins}&tsyms=USD`, {
            success: resData => {
                for (let [key, value] of Object.entries(resData)) {
                    newCoinsList.push(key.toLowerCase());
                }
                if (newCoinsList.includes('response')) {
                    $ELEMENTS.chartContainer.html(`<h4>Sorry. Coins "<span class="text-danger">
                        ${coins.toUpperCase()}</span>" NOT Supported in Chart</h4>`)
                } else {
                    renderChart(newCoinsList);
                    notSupportedCoins(newCoinsList)
                }
            }
        })
    }

};

function renderChart(coinsList) {
    const updateInterval = 3000;
    const coins = coinsList.join(',');
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

    chart.options.data = coinsList.map((name) => {
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
            success: resData => {
                const temp = [];
                for (let [key, value] of Object.entries(resData)) {

                    temp.push(value.USD);
                }
                temp.forEach((value, index) => {
                    chart.options.data[index].dataPoints.push({x: new Date, y: value});
                });
                chart.render()
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

function notSupportedCoins(coinsList) {
    let unique1 = state.chartElement.filter(val => coinsList.indexOf(val) === -1);
    let unique2 = coinsList.filter(val => state.chartElement.indexOf(val) === -1);
    const notSupportedCoins = unique1.concat(unique2);
    if (notSupportedCoins.length > 0) {
        $ELEMENTS.notSupCoins.html(`<h5>Sorry. Coins "<span class="text-danger">
            ${notSupportedCoins.join(', ').toUpperCase()}</span>" NOT Supported in Chart</h5>`)
    }
}




