const logger = require('eazy-logger').Logger({
	useLevelPrefixes: false
});

const config = require('./config');

const BlinkTradeRest = require('blinktrade').BlinkTradeRest;
const _prompt = require('prompt');
const columnify = require('columnify');
const colors = require('colors/safe');

const blinktrade = new BlinkTradeRest({
	prod: true,
	key: config.KEY,
	secret: config.SECRET,
	currency: 'BRL'
});


class Nerraw {
	start(){
		logger.info(colors.blue.bold('Hello, My name is Nerraw.'));

		blinktrade.balance().then((balance) => {
			logger.info('balance');
			logger.info(`${balance}`);
		});
		this.info();
	}

	menu(){
		let _this = this;

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
		}, (err, result) => {
			// transform to lower case
			let action = result.confirm.toLowerCase();

			switch (action){
			case 'i':
			case 'info':
				_this.info();
				break;

			case 's':
			case 'sell':
				_this.sell();
				break;

			case 'b':
			case 'buy':
				_this.buy();
				break;

			case 'sellMarketing':
				blinktrade.ticker().then((ticker) => {
					// logger.info(ticker.sell);

					let price = (ticker.sell-0.01);
					let qty = 0.1;

					let data = {price:price, qty:qty};

					logger.info(data);
					// sell(data);
				});
				break;

			case 'c':
			case 'cancel':
				_this.cancelAll();
				break;

			case 'q':
			case 'quit':
				process.exit();
				break;

			}
			
		});
	}

	sell(){
		let _this = this;
		logger.info(colors.red('SELLING BITCOIN'));
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
		},	(err, result) => {
			let qty = result.confirm;

			_prompt.get({
				properties: {
				// setup the dialog
					confirm: {
					// pattern: /^(buy|b|sell|s|info|i)$/gi,
						description: 'Price',
						message: '',
						required: true,
						default: _this.ticker.sell
					}
				}
			},	(err, result) =>	{
				let price = result.confirm;
				let data = {qty:qty, price: price};
				_this._sell(data);
			});

		});
	}

	buy(){
		let _this = this;
		logger.info(colors.green('BUYING BITCOIN.info'));

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
		}, (err, result) => {
			let qty = result.confirm;

			_prompt.get({
				properties: {
					// setup the dialog
					confirm: {
						// pattern: /^(buy|b|sell|s|info|i)$/gi,
						description: 'Price',
						message: '',
						required: true,
						default: _this.ticker.buy
					}
				}
			}, (err, result) => {
				let price = result.confirm;

				let data = {qty:qty, price: price};
				_this._buy(data);
			});

		});
	}

	_sell(data){
		let _this = this;
		logger.info(data);
		logger.info(blinktrade);
		blinktrade.sendOrder({
			'side': '2',
			'price': parseInt((data.price * 1e8).toFixed(0)),
			'amount': parseInt((data.qty * 1e8).toFixed(0)),
			'symbol': 'BTCBRL',
		}).then((order) => {
			logger.info(`${order}`);
			_this.menu();
		});
	}

	_buy(data){
		let _this = this;
		blinktrade.sendOrder({
			'side': '1',
			'price': parseInt((data.price * 1e8).toFixed(0)),
			'amount': parseInt((data.qty * 1e8).toFixed(0)),
			'symbol': 'BTCBRL',
		}).then((order) => {
			logger.info(`${order}`);
			_this.menu();
		});
	}

	book(){
		let _this = this;
		blinktrade.orderbook().then((orderbook) =>{
			let bids = orderbook.bids.slice(0,25);
			let asks = orderbook.asks.slice(0,25);

			let _bids = [];

			bids.forEach((bid, i) =>{
				_bids.push({ 
					bid_price: colors.green(bid[0]),
					bid_qty: colors.green(bid[1]),
					space: '',
					ask_price : colors.red(asks[i][0]),
					ask_qty : colors.red(asks[i][1])
				});
			});

            const value = columnify(_bids)
			logger.info(`${value}`);
			_this.menu();
		});
	}


	info(){
		let _this = this;
		blinktrade.ticker().then((ticker) => {
			
			_this.ticker = ticker;
			logger.info( columnify([{
				HIGH: colors.green(ticker.high),
				LOW: colors.red(ticker.low)
			}]));

			logger.info('-----------');
			let data = [
				{
					BUY: colors.green(ticker.buy),
					SELL: colors.red(ticker.sell),
					LAST: colors.yellow.bold(ticker.last)
				}
			];

            const value = columnify(data)
			logger.info(`${value}`);
			logger.info('-----------');
			_this.book();
		});
	}

	cancelAll(){
		let _this = this;
		blinktrade.myOrders().then((myOrders) => {
			logger.info(myOrders);

			myOrders.OrdListGrp.map(order => {
				if (order.OrdStatus != 2 && order.OrdStatus != 4) {

					_this._cancelOrder(order);
				}
			});

			_this.menu();
		});
	}

	_cancelOrder(order){
		logger.info(order);
		blinktrade
			.cancelOrder({ 
				orderID: order.OrderID,
				clientId: order.ClOrdID
			}).then((order) => {
				logger.info(`${order}`);
				logger.info.error('Order Cancelled');
			});
	}

}
module.exports = Nerraw;
