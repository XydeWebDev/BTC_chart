// Изменение цены в реальном времени
function fetchBtcPrice() {
    const btcDecimalLimit = 2;

    fetch('https://api.coincap.io/v2/assets/bitcoin')
    .then(response => response.json())
    .then(data => {
        const btcData = data.data;

        const priceElement = document.getElementById('btc-price');
        const percentElement = document.getElementById('btc-percent');

        const currentPrice = parseFloat(priceElement.textContent.replace(/\$|\s/g, '').replace(',', '.'));
        const newPrice = parseFloat(btcData.priceUsd);
        const percent = parseFloat(btcData.changePercent24Hr).toFixed(2);
        const newRoundedPrice = parseFloat(newPrice.toFixed(btcDecimalLimit));
        const formattedPrice = newRoundedPrice.toLocaleString(undefined, { minimumFractionDigits: btcDecimalLimit, maximumFractionDigits: btcDecimalLimit });
        
        document.getElementById('btc-price').textContent = `$${formattedPrice}`;
        document.getElementById('btc-percent').textContent = `${percent}%`;

        if (newRoundedPrice > currentPrice) {
            priceElement.classList.remove('decrease');
            priceElement.classList.add('increase');
        } else if (newRoundedPrice < currentPrice) {
            priceElement.classList.remove('increase');
            priceElement.classList.add('decrease');
        } else {
            priceElement.classList.remove('increase', 'decrease');
        }

        if (percent > 0) {
            percentElement.classList.remove('negative');
            percentElement.classList.add('positive');
        } else if (percent < 0) {
            percentElement.classList.remove('positive');
            percentElement.classList.add('negative');
        } else {
            percentElement.classList.remove('positive', 'negative');
        }
    })
    .catch(error => {
        console.log('Error:', error);
    });
}

// Изменение цены каждые 30 секунд
setInterval(fetchBtcPrice, 30000); 
fetchBtcPrice();


// Получение данных цены через CoinCap API
async function getCoinPriceData(interval) {
    try {
        const response = await fetch(`https://api.coincap.io/v2/assets/bitcoin/history?interval=${interval}`);
        const data = await response.json();

        const priceData = data.data.map(item => {
            const date = new Date(item.time);
            let formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            if (interval == "m1" || interval == "m15" || interval == "h1") {
                formattedDate = date.toLocaleDateString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                });;
            };

            return {
                price: item.priceUsd,
                date: formattedDate
            };
        });
        return priceData;
    } catch (error) {
        console.error('Error:', error);
    }
}

let currentChart = null; // Хранит ссылку на текущий график

async function createCoinChart(interval) {
    if (currentChart) {
        currentChart.destroy(); // Уничтожаем предыдущий график, если он существует
    }

    const coinPrices = await getCoinPriceData(interval);
    const coinDates = coinPrices.map(priceData => priceData.date);

    const firstPrice = coinPrices[0].price;
    const lastPrice = coinPrices[coinPrices.length - 1].price;
    let lineColor = '#00FF00'; // Зеленый цвет при росте
    if (firstPrice > lastPrice) {
        lineColor = '#FF0000'; // Красный цвет при падении
    }

    const ctx = document.getElementById('coin-chart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: coinDates,
            datasets: [{
                label: 'Coin Price',
                data: coinPrices.map(priceData => priceData.price),
                borderColor: lineColor,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 7,
                borderWidth: 3,
                tension: 0.4
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: true,
                    grid: {
                        display: true,
                        color: "#808080",
                        lineWidth: 0.1
                    }
                }
            },
            tooltips: {
                callbacks: {
                    label: function (context) {
                        const priceData = coinPrices[context.dataIndex];
                        return `Date: ${priceData.date}, Price: ${priceData.price}`;
                    }
                }
            }
        }
    });
}


// Получаем все кнопки
let buttons = document.querySelectorAll(".button");

// Добавляем обработчик события "click" для каждой кнопки
buttons.forEach(function(button) {
    button.addEventListener("click", function() {
        let interval = button.id;

        if (interval == '1d') {
            createCoinChart("m1");
        } else if (interval == '7d') {
            createCoinChart("m15");
        } else if (interval == '1m') {
            createCoinChart("h1");
        } else if (interval == '1y') {
            createCoinChart("d1");
        };
    });
});

window.addEventListener('load', function() {
    let button = document.getElementById('1d');
    button.click();
    button.focus();
});