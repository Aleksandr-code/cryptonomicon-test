import API_KEY from '../config.js'

const tickersHandlers = new Map()

const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)

const AGGREGATE_INDEX = '5';

socket.addEventListener('message', e => {
    // console.log(e)
    const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice, MESSAGE: messageData, PARAMETER: parameter} = JSON.parse(e.data)
    
    let invalidSub = false
    if(messageData === 'INVALID_SUB'){
        const invalidTicker = parameter.split('~')[2]
        invalidSub = true
        tickersHandlers.get(invalidTicker).forEach(fn => fn('-', invalidSub))
    }

    if(!type === AGGREGATE_INDEX || newPrice === undefined){
        return
    }

    const handlers = tickersHandlers.get(currency) ?? []
    // добавлять в коллбэк ошибку
    handlers.forEach(fn => fn(newPrice, invalidSub))
})


function sendToWebSocket(message){
    const stringifiedMessage = JSON.stringify(message)

    if(socket.readyState === WebSocket.OPEN){
      socket.send(stringifiedMessage)
      return   
    }
    socket.addEventListener('open', () => {
        socket.send(stringifiedMessage)
    }, {once: true})
    
}

function subscribeToTickerOnWs(ticker){
    sendToWebSocket({
        "action": "SubAdd",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    })
}
function unsubscribeFromTickerOnWs(ticker){
    sendToWebSocket({
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    })
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.has(ticker) || []
    tickersHandlers.set(ticker, [...subscribers, cb])
    subscribeToTickerOnWs(ticker)
}

export const unsubscribeFromTicker = (ticker) =>{
    tickersHandlers.delete(ticker)
    unsubscribeFromTickerOnWs(ticker)
}

window.tickersHandlers = tickersHandlers