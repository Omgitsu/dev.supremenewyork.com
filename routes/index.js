var express = require('express');
var router = express.Router();

const ERROR_CODES = [ {400: 'Bad Request',           'delay': 1 * 1000},
                      {401: 'Unauthorized',          'delay': 0 * 1000},
                      {403: 'Forbidden',             'delay': 0 * 1000},
                      {404: 'Not Found',             'delay': 0 * 1000},
                      {500: 'Internal Server Error', 'delay': 0 * 1000},
                      {502: 'Bad Gateway',           'delay': 1 * 1000},
                      {503: 'Service Unavailable',   'delay': 5 * 1000},
                      {504: 'Gateway Timeout',       'delay': 5 * 1000},];

const ERROR_ODDS = 1/2;

/* GET home page. */
router.get('/mobile_stock.json', function(req, res, next) {

  const roll = Math.random();

  if (roll<=ERROR_ODDS) {
    let index = Math.floor(Math.random()*ERROR_CODES.length)
    let item = ERROR_CODES[index];
    let code = Object.keys(item)[0];
    let delay = item.delay;
    console.log(code + ' waiting: ' + delay + 'ms');

    setTimeout(()=>{res.sendStatus(code)}, delay);

  } else {

    res.render('mobile_stock', { 
      layout: false, 
      title: 'dev.supremenewyork.com',
      week: '15FW17', // 16FW17
      date: '12/07/2017' // 11/30/2017 or 12/07/2017
    });
  }
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
