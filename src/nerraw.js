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

const OrdRejReason = {
	'0' :  'Broker / Exchange option',
	'1' :  'Unknown symbol',
	'2' :  'Exchange closed',
	'3' :  'Order exceeds limit',
	'4' :  'Too late to enter',
	'5' :  'Unknown Order',
	'6' :  'Duplicate Order (e.g. dupe ClOrdID <11>)',
	'7' :  'Duplicate of a verbally communicated order',
	'8' :  'Stale Order',
	'9' :  'Trade Along required',
	'10' : 'Invalid Investor ID',
	'11' : 'Unsupported order characteristic',
	'12' : 'Surveillence Option'
};


class Nerraw {
	start(){
		logger.info(colors.blue.bold('Hello, My name is Nerraw.'));
		blinktrade.balance().then( (balance) => {
			logger.info('balance');
			logger.info(balance);
		});
		this.info();
	}

	menu(){

		_prompt.get({
			properties: {
				// setup the dialog
				confirm: {
					// allow yes, no, y, n, YES, NO, Y, N as answer
					pattern: /^(buy|b|sell|s|price|p|c|cancel|q|quit)$/gi,
					description: colors.blue('How can I help you?\n '+ 
						colors.yellow.bold('(b)') +'uy\n '+ 
						colors.yellow.bold('(s)') +'ell\n '+ 
						colors.yellow.bold('(p)') +'rices (book)\n '+ 
						colors.yellow.bold('(c)') +'ancel all order \n '+ 
						colors.yellow.bold('(q)') +'uit\n '),
					message: '',
					required: true,
					default: 'i'
				}
			}
		},  (err, result) => {
			// transform to lower case
			const action = result.confirm.toLowerCase();

			switch (action){
			case 'p':
			case 'prices':
				this.info();
				break;

			case 's':
			case 'sell':
				this.sell();
				break;

			case 'b':
			case 'buy':
				this.buy();
				break;

			case 'sellMarketing':
				// @todo
				// blinktrade.ticker().then( (ticker) => {
				// 	let price = (ticker.sell-0.01);
				// 	let qty = 0.1;

				// 	let data = {price:price, qty:qty};

				// 	// logger.info(data);
				// 	// sell(data);
				// });
				break;

			case 'c':
			case 'cancel':
				this.cancelAll();
				break;

			case 'q':
			case 'quit':
				process.exit();
				break;

			}
			
		});
	}

	sell(){
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
		}, (err, result) => {
			const qty = result.confirm;

			_prompt.get({
				properties: {
					// setup the dialog
					confirm: {
						// pattern: /^(buy|b|sell|s|info|i)$/gi,
						description: 'Price',
						message: '',
						required: true,
						default: this.ticker.sell
					}
				}
			}, (err, result) => {
				const price = result.confirm;
				this._sell({qty, price});
			});
		});
	}

	buy(){
		logger.info(colors.green('BUYING BITCOIN'));

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
			const qty = result.confirm;

			_prompt.get({
				properties: {
					// setup the dialog
					confirm: {
						// pattern: /^(buy|b|sell|s|info|i)$/gi,
						description: 'Price',
						message: '',
						required: true,
						default: this.ticker.buy
					}
				}
			}, (err, result) => {
				const price = result.confirm;
				this._buy({qty , price});
			});

		});
	}

	_sell(data){
		blinktrade.sendOrder({
			'side': '2',
			'price': parseInt((data.price * 1e8).toFixed(0)),
			'amount': parseInt((data.qty * 1e8).toFixed(0)),
			'symbol': 'BTCBRL',
		}).then( (order) => {

			if( order.constructor === Array && order[0].OrderID !== null){
				logger.info( colors.green.bold(`# SELL ORDER CREATED. #`) );
				logger.info( colors.green(`Order ID: ${order[0].OrderID}`) );
			}else{
				logger.info( colors.red.bold(`# SELL ORDER NOT CREATED #`) );
				logger.info( colors.red(`${OrdRejReason[order.OrdRejReason]}`) );
			}

			this.menu();
		});
	}

	_buy(data){
		blinktrade.sendOrder({
			'side': '1',
			'price': parseInt((data.price * 1e8).toFixed(0)),
			'amount': parseInt((data.qty * 1e8).toFixed(0)),
			'symbol': 'BTCBRL',
		}).then( (order) => {

			if( order.constructor === Array && order[0].OrderID !== null){
				logger.info( colors.green.bold(`# BUY ORDER CREATED #.`) );
				logger.info( colors.green(`Order ID: ${order[0].OrderID}`) );
			}else{
				logger.info( colors.red.bold('# BUY ORDER NOT CREATED #') );
				logger.info( colors.red(`${OrdRejReason[order.OrdRejReason]}`) );
			}

			this.menu();
		});
	}

	book(){
		blinktrade.orderbook().then( (orderbook) => {
			const bids = orderbook.bids.slice(0,25);
			const asks = orderbook.asks.slice(0,25);

			const _bids = bids.forEach( (bid, i) => {
				return { 
					bid_price: colors.green(bid[0]),
					bid_qty: colors.green(bid[1]),
					space: '',
					ask_price : colors.red(asks[i][0]),
					ask_qty : colors.red(asks[i][1])
				};
			});

			logger.info(columnify(_bids));
			this.menu();
		});
	}


	info(){
		blinktrade.ticker().then( (ticker) => {

			this.ticker = ticker;

			logger.info( columnify([{
				HIGH: colors.green(ticker.high),
				LOW: colors.red(ticker.low)
			}]));

			

			const data = [
				{
					BUY: colors.green(ticker.buy),
					SELL: colors.red(ticker.sell),
					LAST: colors.yellow.bold(ticker.last)
				}
			];


			logger.info(`-----------\n${columnify(data)}\n-----------`);
			this.book();
		});
	}

	cancelAll(){
		blinktrade.myOrders().then( (myOrders) => {
			myOrders.OrdListGrp.forEach(order => {
				if(order.OrdStatus != 2 && order.OrdStatus != 4){
					this._cancelOrder(order);
				}
			});
			this.menu();
		});
	}

	_cancelOrder(order){
		blinktrade.cancelOrder({ orderID: order.OrderID, clientId: order.ClOrdID }).then( (order) => {
			logger.info( colors.yellow.bold('ORDER CANCELLED') );
			logger.info( colors.yellow(`Order id: ${order[0].OrderID}}`) );
		});
	}

}
module.exports = Nerraw;
