import API_KEY from '../config.js'

const tickersHandlers = new Map()

const loadTickers = () => {
    if(tickersHandlers.size == 0 ){
        return
    }

    fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD&api_key=${API_KEY}`)
        .then(res => res.json()).
        then(rawData => {
            const updatedPrices = Object.fromEntries(Object.entries(rawData).map(([key, value]) => [key, value.USD]))

            Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
                const handlers = tickersHandlers.get(currency) ?? []
                handlers.forEach(fn => fn(newPrice))
            })
    })
}


// setInterval(loadTickers, 5000)        


export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.has(ticker) || []
    tickersHandlers.set(ticker, [...subscribers, cb])
}

export const unsubscribeFromTicker = (ticker) =>{
    tickersHandlers.delete(ticker)
}

window.tickersHandlers = tickersHandlers