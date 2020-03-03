const state = {
    url: 'https://api.coingecko.com/api/v3/coins/',
    urlFullList: 'https://api.coingecko.com/api/v3/coins/list',
    responseArr: null,
    dataToShowArr: null,
    topCoins: ['btwty', '42', 'nanox', 'btc', 'wbtc', 'btcb', 'bitbtc', 'rbtc', 'thr', 'mkr', 'bch', 'eth', 'bsv', 'dash', 'xmr', 'ltc', 'zec', 'dgd', 'mapr'],
    newCoinsList: [],
    moreInfoCache: [],
    cacheLiveTime: 60000,    // 60000ms (1 min)
    chartElement: [],
    searchData: [],
    intervalId: null,
    pageCounter: 1,
    lastIndex: 0,
    numAllPages: 0,
    chartUpdateInterval: 3000,   // ms
    indexEvaluation: 20    // number cards on page
};
const $ELEMENTS = {
    searchForm: $('#search-form'),
    content: $('#home'),
    home: $('#nav-home'),
    reports: $('#nav-reports'),
    topCoinsBtn: $('#top-coins'),
    topCoinsContent: $('#topContent'),
    clearSearch: $('#clear'),
    searchTab: $('#nav-search-res'),
    modalContent: $('#modalContent'),
    saveModalBtn: $('#save-modal'),
    showChartModalBtn: $('#chart-modal'),
    searchRes: $('.searchRes'),
    prevBtn: $('.prev'),
    nextBtn: $('.next'),
    pageNum: $('.pageNumber'),
    navStatusPrevBtn: $('.navStatusPrevBtn'),
    navStatusNextBtn: $('.navStatusNextBtn'),
    selectNumCardsOnPage: $('#select'),
    chartUpdateInterval: $('#interval'),
    resetSelected: $('#resetSelected'),
    numFound: $('#numFound'),
    chartContainer: $('#chartContainer'),
    notSupCoins: $('#notSupported')
};

//----- main app-----
function main() {
    getData();
    $ELEMENTS.searchForm.on('submit', search);
    $ELEMENTS.home.on('click', homeBtn);
    $ELEMENTS.clearSearch.on('click', clearSearch);
    $ELEMENTS.reports.on('click', chartModule);
    $ELEMENTS.searchTab.on('click', searchTab);
    $ELEMENTS.saveModalBtn.on('click', saveModalBtn);
    $ELEMENTS.showChartModalBtn.on('click', showChartModalBtn);
    $ELEMENTS.nextBtn.on('click', nextBtn);
    $ELEMENTS.prevBtn.on('click', prevBtn);
    $ELEMENTS.selectNumCardsOnPage.on('change', selectNumCardsOnPage);
    $ELEMENTS.resetSelected.on('click', resetSelected);
    $ELEMENTS.topCoinsBtn.on('click', topCoins);
    $ELEMENTS.chartUpdateInterval.on('change', chartUpdateInterval);
    $ELEMENTS.resetSelected.hide();
}

main();

function chartUpdateInterval() {
    const val = parseInt($($ELEMENTS.chartUpdateInterval).val());
    state.chartUpdateInterval = val * 1000;
    clearInterval(state.intervalId);
    renderChart(state.newCoinsList);
}

//----- get Data from API-----
function getData() {
    $.ajax(state.urlFullList, {
        success: data => {
            state.responseArr = data;
            preparingData()
        },
        error: (jqXHR, textStatus) => {
            $ELEMENTS.content.html(`<h3 class="text-center text-danger">${textStatus} ${jqXHR.status}, ${jqXHR.responseText}</h3>`);
            console.log(jqXHR);
        }
    })
}

function preparingData() {
    $ELEMENTS.content.html('');
    state.responseArr = state.responseArr.filter((obj, index, self) =>
        index === self.findIndex((val) => (
            val.symbol === obj.symbol
        ))
    );
    state.dataToShowArr = state.responseArr.slice(0, state.indexEvaluation);
    state.lastIndex = state.indexEvaluation;
    state.numAllPages = Math.round(state.responseArr.length / state.indexEvaluation);
    $ELEMENTS.pageNum.text(`${state.pageCounter} of ${state.numAllPages}`);
    renderCards(state.dataToShowArr);
    console.log(state.responseArr)
}

//----------- card section
function renderCards(responseObj, tabContainer = $ELEMENTS.content) {
    responseObj.forEach((arrEl) => {
        const $card = createCardEl(arrEl);
        tabContainer.append($card);
        checkBoxStatus($card, arrEl.symbol)
    });
    $('.more-btn').on('click', getMoreInfo);
    $('.check').on('change', addToChart);
}

function checkBoxStatus($el, name) {
    if (state.chartElement.includes(name)) {
        $el.find('.check').prop('checked', true);
        $(`.${name}`).removeClass('bg-light').addClass('checkedCard');
        console.log(name)
    }
}

//--------- more info section----
function getMoreInfo(e) {
    const card = e.target;
    const cardId = card.id;
    const $moreCont = $(`.${card.id}-content`);
    const $showEl = $(`#${card.id}-con`);
    if (!$showEl.hasClass('show')) {
        $moreCont.html(spinner());
        moreInfoDataPromise(cardId, $moreCont);
    }
    $showEl.collapse('toggle');
}

function getMoreData(cardId, $moreCont) {
    return new Promise(resolve => {
        $.ajax(`${state.url}${cardId}`, {
            success: data => {
                const moreInfoObj = {
                    img: data.image.small,
                    usd: data.market_data.current_price.usd,
                    eur: data.market_data.current_price.eur,
                    ils: data.market_data.current_price.ils,
                    name: data.name,
                    symbol: data.symbol,
                    time: Date.now()
                };
                resolve(moreInfoObj)
            },
            error: (jqXHR, textStatus) => {
                $moreCont.html(`<p class="text-center text-danger">${textStatus} ${jqXHR.status}</p>`)
            }
        })
    })
}

// --------- More Info Cache section-----
async function updateMoreInfFromCache(index, $moreCont, cardId) {
    const timeNow = Date.now();
    if ((state.moreInfoCache[index].time + state.cacheLiveTime) < timeNow) {
        const newMoreInfoObj = await getMoreData(cardId, $moreCont);
        state.moreInfoCache[index].time = timeNow;
        $moreCont.html(moreHtmlEl(newMoreInfoObj));
    } else {
        $moreCont.html(moreHtmlEl(state.moreInfoCache[index]));
    }
}

async function moreInfoDataPromise(cardId, $moreCont) {
    const moreInfoObj = await getMoreData(cardId, $moreCont);
    const index = state.moreInfoCache.findIndex(obj => {
        return obj.symbol === moreInfoObj.symbol
    });

    if (index === -1) {                               // add to Cache
        state.moreInfoCache.push(moreInfoObj);
        $moreCont.html(moreHtmlEl(moreInfoObj))
    } else {
        updateMoreInfFromCache(index, $moreCont, cardId)
    }
}

//--------- Modal section-------
function addToChart(e) {
    const val = e.target;

    if ($(this).is(':checked')) {
        state.chartElement.push(val.id);
        $(`.${val.id}`).removeClass('bg-light').addClass('checkedCard');
        $ELEMENTS.resetSelected.show(300)
    } else {
        const index = state.chartElement.findIndex(index => index === val.id);
        state.chartElement.splice(index, 1);
        $(`.${val.id}`).removeClass('checkedCard').addClass('bg-light');
    }

    if (state.chartElement.length > 5) {
        renderModalEl()
    }
    if (state.chartElement.length <= 5) {
        $ELEMENTS.showChartModalBtn.removeAttr('disabled');
        $ELEMENTS.saveModalBtn.removeAttr('disabled');
    }
    if (state.chartElement.length === 0) {
        $ELEMENTS.resetSelected.hide(300)
    }
}

function renderModalEl() {
    const cardEl = [];
    generateFilteredArr(state.chartElement, cardEl);

    $ELEMENTS.modalContent.html('');
    $ELEMENTS.content.html('');
    $ELEMENTS.searchRes.html('');
    $ELEMENTS.topCoinsContent.html('');
    $('#modal').modal('show');
    renderCards(cardEl, $ELEMENTS.modalContent);
    $('.more-btn').hide();
    $ELEMENTS.saveModalBtn.prop('disabled', true);
    $ELEMENTS.showChartModalBtn.prop('disabled', true);
}

function showChartModalBtn() {
    $('#modal').modal('hide');
    $ELEMENTS.reports.tab('show');
    chartModule()
}

function saveModalBtn() {
    if ($ELEMENTS.searchTab.hasClass('active')) {
        searchTab()
    } else if ($ELEMENTS.topCoinsBtn.hasClass('active')) {
        topCoins()
    } else {
        renderCards(state.dataToShowArr)
    }
}

//----- search section-------
function search(e) {
    clearInterval(state.intervalId);
    e.preventDefault();
    const input = e.target;
    const name = input.search.value.toLowerCase();
    $ELEMENTS.numFound.html('');

    state.searchData = [];
    state.responseArr.filter(val => {
        if (val.symbol.startsWith(name)) state.searchData.push(val.symbol)
    });
    $ELEMENTS.numFound.html(`<h4 class="mt-2">
        Found <span class="text-danger">${state.searchData.length}</span> matches with 
        <span class="text-danger">"${name.toUpperCase()}"</span></h4>`);

    $ELEMENTS.content.html('');
    searchTab();               // include renderCard function
    $ELEMENTS.searchTab.tab('show');
    $ELEMENTS.searchForm.trigger('reset');
}

function clearSearch() {
    $ELEMENTS.searchRes.html('');
    $ELEMENTS.numFound.html('<h4 class="text-secondary mt-2">Search history cleared.</h4>');
    setTimeout(() => {
        $ELEMENTS.numFound.html('')
    }, 3000);
    state.searchData = []
}

//---------- tab navigation---
function homeBtn() {
    clearInterval(state.intervalId);
    $ELEMENTS.content.html('');
    $ELEMENTS.searchRes.html('');
    $ELEMENTS.topCoinsContent.html('');
    $ELEMENTS.notSupCoins.html('');
    renderCards(state.dataToShowArr);
}

function searchTab() {
    clearInterval(state.intervalId);
    const searchEl = [];
    $ELEMENTS.content.html('');
    $ELEMENTS.searchRes.html('');
    $ELEMENTS.topCoinsContent.html('');
    $ELEMENTS.notSupCoins.html('');

    if (state.searchData.length === 0) {
        $ELEMENTS.searchRes.html('<h5 class="text-secondary">Search tab is empty.</h5>');
    } else {
        generateFilteredArr(state.searchData, searchEl)
    }
    renderCards(searchEl, $ELEMENTS.searchRes);
}

function topCoins() {
    clearInterval(state.intervalId);
    const topCoinsEl = [];
    $ELEMENTS.content.html('');
    $ELEMENTS.topCoinsContent.html('');
    $ELEMENTS.notSupCoins.html('');
    generateFilteredArr(state.topCoins, topCoinsEl);
    renderCards(topCoinsEl, $ELEMENTS.topCoinsContent)
}

function generateFilteredArr(dataIn, dataOut) {
    dataIn.forEach(symbol => {
        state.responseArr.find((val) => {
            if (val.symbol === symbol) {
                dataOut.push(val)
            }
        });
    });
}

// --------- reset selected Card --
function resetSelected() {
    state.chartElement = [];
    if ($ELEMENTS.searchTab.hasClass('active')) {
        searchTab()
    } else if ($ELEMENTS.topCoinsBtn.hasClass('active')) {
        topCoins()
    } else {
        homeBtn()
    }
    $ELEMENTS.resetSelected.hide(300)
}

//----- Pagination section---
function selectNumCardsOnPage() {
    $ELEMENTS.content.html('');
    const val = parseInt($($ELEMENTS.selectNumCardsOnPage).val());
    state.indexEvaluation = val;
    state.lastIndex = val;
    state.pageCounter = 1;
    state.numAllPages = Math.ceil(state.responseArr.length / val);
    $ELEMENTS.pageNum.text(`${state.pageCounter} of ${state.numAllPages}`);
    $ELEMENTS.navStatusPrevBtn.addClass('disabled');
    $ELEMENTS.navStatusNextBtn.removeClass('disabled');
    state.dataToShowArr = state.responseArr.slice(0, state.indexEvaluation);
    renderCards(state.dataToShowArr);
}

function nextBtn() {
    $ELEMENTS.content.html('');
    state.pageCounter++;
    state.lastIndex += state.indexEvaluation;

    $ELEMENTS.navStatusPrevBtn.removeClass('disabled');

    if (state.responseArr.length <= state.lastIndex) {
        $ELEMENTS.navStatusNextBtn.addClass('disabled')
    }
    $ELEMENTS.pageNum.text(`${state.pageCounter} of ${state.numAllPages}`);
    pagination(state.responseArr, 'next')
}

function prevBtn() {
    $ELEMENTS.content.html('');
    state.pageCounter--;
    state.lastIndex -= state.indexEvaluation;
    if (state.pageCounter === 1) {
        $ELEMENTS.pageNum.text(`${state.pageCounter} of ${state.numAllPages}`);
        $ELEMENTS.navStatusPrevBtn.addClass('disabled');
        state.dataToShowArr = state.responseArr.slice(0, state.lastIndex);
        renderCards(state.dataToShowArr)
    } else {
        if (state.responseArr.length > state.lastIndex) {
            $ELEMENTS.navStatusNextBtn.removeClass('disabled')
        }
        $ELEMENTS.pageNum.text(`${state.pageCounter} of ${state.numAllPages}`);
        pagination(state.responseArr, 'prev')
    }
}

function pagination(dataArr, paginationDirection) {
    if (paginationDirection === 'next') {
        if (state.responseArr.length < state.lastIndex) {
            state.dataToShowArr = dataArr.slice(state.lastIndex - state.indexEvaluation, state.responseArr.length);
        } else {
            state.dataToShowArr = dataArr.slice(state.lastIndex, state.lastIndex + state.indexEvaluation);
        }
    }
    if (paginationDirection === 'prev') {
        state.dataToShowArr = dataArr.slice(state.lastIndex - state.indexEvaluation, state.lastIndex);
    }
    renderCards(state.dataToShowArr)
}

// ---- HTML Elements section-----
function moreHtmlEl(coin) {
    return `<div class="text-center d-flex justify-content-around align-items-center bg-light">
                <div>
                    <img src="${coin.img}" alt="${coin.name}" class="mw-100 text-center">
                </div>
                <div>
                    <span class="d-block">1 <span class="font-weight-bold">${coin.symbol}</span> = ${coin.usd} <span class="font-weight-bold">$</span></span>
                    <span class="d-block">1 <span class="font-weight-bold">${coin.symbol}</span> = ${coin.eur} <span class="font-weight-bold">&euro;</span></span>
                    <span class="d-block">1 <span class="font-weight-bold">${coin.symbol}</span> = ${coin.ils} <span class="font-weight-bold">&#8362;</span></span>
                </div>
            </div>`
}

function createCardEl(responseObj) {
    return $(`
            <div class="${responseObj.symbol} card bg-light shadow-sm">
                <div class="card-body">
                    <p class="card-title d-inline">symbol: <span class="font-weight-bold text-uppercase">${responseObj.symbol}</span></p>
                    <div class="custom-control custom-switch d-inline float-right">
                        <input type="checkbox" class="check custom-control-input" id="${responseObj.symbol}">
                        <label title="Add to Live Chart Reports" class="custom-control-label font-weight-light"
                               for="${responseObj.symbol}"></label>
                    </div>
                    <p class="card-text">name: ${responseObj.name}</p>
                    <button id="${responseObj.id}" class="more-btn btn btn-primary btn-sm" type="button" data-toggle="collapse" 
                        data-target="#${responseObj.id}-con" aria-expanded="false" aria-controls="collapseExample">More Info</button>
                    <div class="collapse mt-2" id="${responseObj.id}-con">
                        <div class="border rounded-lg  ${responseObj.id}-content"></div>
                    </div>
                </div>
            </div>
        `)
}

function spinner() {
    return `<div class="text-center bg-light">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>`
}