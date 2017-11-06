'use strict'

import config from "./config.js";

const BlinkTradeRest = require("blinktrade").BlinkTradeRest;
const _prompt = require('prompt');
const columnify = require('columnify');
const colors = require('colors/safe');

const blinktrade = new BlinkTradeRest({
  prod: true,
  key: config.KEY,
  secret: config.SECRET,
  currency: "BRL"
});


// PUBLIC API

module.exports = {
	start: start,
	menu: menu,
	buy: buy,
	sell: sell,
	info: info,
	book: book,
	cancelAll: cancelAll
}

function start(){
	console.log( colors.blue.bold('Hello, My name is Nerraw.'));

	blinktrade.balance().then(function(balance) {
		console.log('balance');
		console.log(balance);
	});
	info();
}

function menu(){
	_prompt.get({
		properties: {
			// setup the dialog
			confirm: {
				// allow yes, no, y, n, YES, NO, Y, N as answer
				pattern: /^(buy|b|sell|s|info|i|c|cancel|q|quit)$/gi,
				description: colors.blue('How can I help you?\n '+ 
					colors.blue.bold('(b)') +'uy\n '+ 
					colors.blue.bold('(s)') +'ell\n '+ 
					colors.blue.bold('(i)') +'nfo\n '+ 
					colors.blue.bold('(c)') +'ancel all order \n '+ 
					colors.blue.bold('(q)') +'uit\n '),
				message: '',
				required: true,
				default: 'i'
			}
		}
	}, function (err, result){
		// transform to lower case
		let action = result.confirm.toLowerCase();

		switch (action){
			case 'i':
			case 'info':
				info();
				break;

			case 's':
			case 'sell':
				sell();
				break;

			case 'b':
			case 'buy':
				buy();
				break;

			case 'sellMarketing':
				blinktrade.ticker().then(function(ticker) {
					// console.log(ticker.sell);

					let price = (ticker.sell-0.01);
					let qty = 0.1;

					let data = {price:price, qty:qty}

					// console.log(data);
					// sell(data);
				})
				break;

			case 'c':
			case 'cancel':
				cancelAll();
				break;

			case 'q':
			case 'quit':
				process.exit();
				break;

		}
		
	});
}

function sell(){
	console.log(colors.red('SELLING BITCOIN'));
	_prompt.get({
		properties: {
			// setup the dialog
			confirm: {
				// pattern: /^(buy|b|sell|s|info|i)$/gi,
				description: 'Bitcoins quantity',
				message: '',
				required: true,
				default: '0.25'
			}
		}
	}, function (err, result){
		let qty = result.confirm;

		blinktrade.ticker().then(ticker => {
			_prompt.get({
				properties: {
					// setup the dialog
					confirm: {
						// pattern: /^(buy|b|sell|s|info|i)$/gi,
						description: 'Price',
						message: '',
						required: true,
						default: ticker.sell
					}
				}
			}, function (err, result){
				let price = result.confirm;

				let data = {qty:qty, price: price};
				_sell(data);
			})
		})
	})
}

function buy(){
	console.log(colors.green('BUYING BITCOIN'));

	_prompt.get({
		properties: {
			// setup the dialog
			confirm: {
				// pattern: /^(buy|b|sell|s|info|i)$/gi,
				description: 'Bitcoins quantity',
				message: '',
				required: true,
				default: '0.25'
			}
		}
	}, function (err, result){
		let qty = result.confirm;

		blinktrade.ticker().then(ticker => {
			_prompt.get({
				properties: {
					// setup the dialog
					confirm: {
						// pattern: /^(buy|b|sell|s|info|i)$/gi,
						description: 'Price',
						message: '',
						required: true,
						default: ticker.buy
					}
				}
			}, function (err, result){
				let price = result.confirm;

				let data = {qty:qty, price: price};
				_buy(data);
			})

		})
	})
}

function book(){
	blinktrade.orderbook().then(function(orderbook) {
		let bids = orderbook.bids.slice(0,25);
		let asks = orderbook.asks.slice(0,25);

		let _bids = [];

		bids.forEach( function(bid, i){
			_bids.push({bid_price: colors.green(bid[0]), bid_qty: colors.green(bid[1]), space: '', ask_price : colors.red(asks[i][0]), ask_qty : colors.red(asks[i][1])});
		})

		console.log(columnify(_bids));

		// console.log(bids);
		// console.log(asks);

		menu();
	});
}


function info(){
	blinktrade.ticker().then(function(ticker) {

		console.log( columnify([{
			HIGH: colors.green(ticker.high),
			LOW: colors.red(ticker.low)
		}]));

		console.log('-----------')
		let data = [
			{
				BUY: colors.green(ticker.buy),
				SELL: colors.red(ticker.sell),
				LAST: colors.yellow.bold(ticker.last)
			}
		]



		console.log(columnify(data));

		console.log('-----------')
		book();

	});
}

function cancelAll(){
	blinktrade.myOrders().then(function(myOrders) {
		console.log(myOrders);

		myOrders.OrdListGrp.map(order => {
			if (order.OrdStatus != 2 && order.OrdStatus != 4) {
				_cancelOrder(order);
			}
		});

		menu();
	});
}

// PRIVATE

function _sell(data){
	console.log(data);
	console.log(blinktrade);
	blinktrade.sendOrder({
		"side": "2",
		"price": parseInt((data.price * 1e8).toFixed(0)),
		"amount": parseInt((data.qty * 1e8).toFixed(0)),
		"symbol": "BTCBRL",
	}).then(function(order) {
		console.log(order);
		menu();
	});
}

function _buy(data){
	blinktrade.sendOrder({
		"side": "1",
		"price": parseInt((data.price * 1e8).toFixed(0)),
		"amount": parseInt((data.qty * 1e8).toFixed(0)),
		"symbol": "BTCBRL",
	}).then(function(order) {
		console.log(order);
		menu();
	});
}

function _cancelOrder(order){
	console.log(order)
	blinktrade.cancelOrder({ orderID: order.OrderID, clientId: order.ClOrdID }).then(function(order) {
		console.log(order);
		console.log("Order Cancelled");
	});
}
