var express = require('express');
var router = express.Router();
var form = require('express-form');
var field = form.field;


// ********
// settings
// ********
// MARK:settings

/*

  cases where the server could screw with you:
  * not the latest version of the stocklist
  * missing items that *should* be there
  * server fuckups (400-500) status codes
  * broken json or partially returned json
  * returns empty html (but status code is fine)
  * crashes and takes waaaay too long to do anything (somewhat covered by the 500 error codes)
  * goes out of stock in between finding the item, seeing it's in stock and the request to add it is recognized
  
  cases where you fucked up (not handled here):
  * misspelled keywords
  * incorrect color choices
  * item isn't going to actually drop that week
   
*/

/* 
  ** note - a 200 OK is an an OK response, but we are sending it back as just an empty page
  which WILL be a screwup since no pages should respond as just empty
  TODO: for completeness might want to add 301 redirects as error conditions
*/
var ERROR_CODES = [   {400: 'Bad Request',           'delay': 1 * 1000},
                      {401: 'Unauthorized',          'delay': 0 * 1000},
                      {403: 'Forbidden',             'delay': 0 * 1000},
                      {404: 'Not Found',             'delay': 0 * 1000},
                      {500: 'Internal Server Error', 'delay': 0 * 1000},
                      {502: 'Bad Gateway',           'delay': 1 * 1000},
                      {503: 'Service Unavailable',   'delay': 5 * 1000},
                      {504: 'Gateway Timeout',       'delay': 5 * 1000},];

const ALLOW_ERRORS = true;
const ERROR_ODDS = 1/10;
const ENABLE_DELAYS = false
const BROKEN_JSON_ODDS = 1/10;
const OUT_OF_STOCK_ODDS = 1/10;
const ADD_TO_CART_MAX_DELAY = 5 * 1000;
const DROP_WEEK_COUNT = 19;
const DROP_SEASON = 'SS';
const DROP_YEAR = '18';
// const IGNORE_DROP_WEEK = 'false';
const WRONG_DROP_WEEK = '01FW94';
const DEFAULT_DATE = '12/07/2017'; 

function dropWeeks() {
  var drops = []
  for (var i=1; i <= DROP_WEEK_COUNT; i++) {
    var drop = '' + i;
    if (i < 10) {
      drop = 0 + drop;
    }
    drops.push(drop + DROP_SEASON + DROP_YEAR);
  }
  return drops;
}

let dropWeek = dropWeeks()[0];

var settings = {
  'enable_http_errors': ALLOW_ERRORS,
  'http_error_odds': ERROR_ODDS,
  'enable_blank_200_response': true,
  'enable_delays': ENABLE_DELAYS,
  'broken_json_odds': BROKEN_JSON_ODDS,
  'item_in_stock': 'maybe',
  'out_of_stock_odds': OUT_OF_STOCK_ODDS,
  'add_to_cart_max_delay': ADD_TO_CART_MAX_DELAY,
  'drop_weeks': dropWeeks(),
  'target_drop_week': dropWeek,
  // 'ignore_drop_week': IGNORE_DROP_WEEK,
  'use_target_drop_week': true,
}

function setSettings() {
  if (settings.enable_blank_200_response) {
    {
      ERROR_CODES.push({200: 'OK', 'delay': 3 * 1000},)
    }
  }
}


console.log(settings);

// ********
// errors
// ********
// MARK:errors

function returnError(res) {

  let delay = 0
  let index = Math.floor(Math.random()*ERROR_CODES.length)
  let item = ERROR_CODES[index];
  let code = Object.keys(item)[0];
  if (settings.enable_delays) {
    delay = item.delay;
  }
  console.log(code + ' waiting: ' + delay + 'ms');
  setTimeout(()=>{res.sendStatus(code)}, delay);
}

function isError(odds) {
  if (settings.enable_http_errors && Math.random() <= odds) {
    return true
  }
  return false
}

// ********
// Convenience
// ********
// MARK:Convenience

function randomIntBetween(low, high) {
  return Math.floor(Math.random() * high) + low 
}

/* 

  supremenewyork.com endpoints we are going to use here
  * stocklist: /mobile_stock.json
  * item json (with styles): /shop/${itemID}.json
  * add to cart: /shop/${itemID}/add
  * checkout form: /checkout
  * 
*/ 


/* GET the mobile stocklist */
router.get('/mobile_stock.json', function(req, res, next) {

  if (isError(settings.http_error_odds)) {
    returnError(res);
  } else {

    var template = 'mobile_stock';
    if (isError(settings.broken_json_odds)) {
      template = 'mobile_stock_broken';
      console.log('return broken json');
    }
    
    let drop_week = WRONG_DROP_WEEK;
    if (settings.use_target_drop_week) {
      drop_week = settings.target_drop_week
    }

    res.render(template, { 
      layout: false, 
      title: 'dev.supremenewyork.com',
      week: drop_week,
      date: DEFAULT_DATE,
    });
  }
});

/* GET the JSON for a certain item  */
router.get('/shop/:item_id', function(req, res, next) {

  if (isError(settings.http_error_odds)) {
    returnError(res);
  } else {

    let item_id = req.params.item_id.split('.')[0]
    var template = item_id;
    if (isError(settings.broken_json_odds)) {
      template = item_id + '_broken';
      console.log('return broken json');
    }

    var stock = 1;
    if (isError(settings.out_of_stock_odds)) {
      stock = 0
    }
    
    res.render(template, { 
      layout: false, 
      title: item_id,
      stock: stock
    });
  }

});

/* 
  GET add to cart page 
  /shop/${itemID}/add
  can throw errors, and can be successful with long delays
*/
router.get('/shop/:item_id/add', function(req, res, next) {

  if (isError(settings.http_error_odds)) {
    returnError(res);
  } else {

    // make sure template exists
    // this will mock a bad item_id 
    let item_id = req.params.item_id
    res.render(item_id, {}, function(err, html) {
      if(err) {
        res.sendStatus(404)
      } else {
        var delay = 0
        if (settings.enable_delays) {
          delay = randomIntBetween(0, settings.add_to_cart_max_delay);
          console.log("Add successful but delaying by: " + delay + "ms");      
        }
        setTimeout(()=>{res.sendStatus(200)}, delay);
      }
    });
  }
});

/* 
 GET the checkout page / form 
*/
router.get('/checkout', function(req, res, next) {

  res.render('checkout', { 
    layout: false, 
    title: 'CHECKOUT!'
  });

});


function renderSettings(res) {
  res.render('settings', settings);
}

/* GET settings page. */
router.get('/settings', function(req, res, next) {
  renderSettings(res);
});



/* 
  target_drop_week
  enable_http_errors
  http_error_odds
  enable_blank_200_response
  enable_delays
  broken_json_odds
  item_in_stock
  out_of_stock_odds
  add_to_cart_max_delay
  target_drop_week
  use_target_drop_week
*/
router.post(
 
  // Route 
  '/settings',
 
  // Form filter and validation middleware 
  form(
    field("target_drop_week").trim().required(),
    field("enable_http_errors").toBoolean(),
    field("http_error_odds").trim().required(),
    field("enable_blank_200_response").toBoolean(),
    field("enable_delays").toBoolean(),
    field("broken_json_odds").trim().required(),
    field("item_in_stock").trim().required(),
    field("out_of_stock_odds").trim().required(),
    field("add_to_cart_max_delay").trim().required(),
    field("target_drop_week").trim().required(),
    // field("ignore_drop_week").toBoolean(),
    field("use_target_drop_week").toBoolean(),
   ),
 
   // Express request-handler now receives filtered and validated data 
   function(req, res, next){

    const new_settings = {
      'enable_http_errors': req.form.enable_http_errors,
      'http_error_odds': req.form.http_error_odds,
      'enable_blank_200_response': req.form.enable_blank_200_response,
      'enable_delays': req.form.enable_delays,
      'broken_json_odds': req.form.broken_json_odds,
      'item_in_stock': req.form.item_in_stock,
      'out_of_stock_odds': req.form.out_of_stock_odds,
      'add_to_cart_max_delay': req.form.add_to_cart_max_delay,
      'drop_weeks': dropWeeks(),
      'target_drop_week': req.form.target_drop_week,
      // 'ignore_drop_week': req.form.ignore_drop_week,
      'use_target_drop_week': req.form.use_target_drop_week,
   }
   settings = new_settings;
   setSettings();

   console.log(settings);

     if (!req.form.isValid) {
       // Handle errors 
       console.log(req.form.errors);
       renderSettings(res);
 
     } else {
      renderSettings(res);
     }
  }
);


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'dev.supremenewyork.com' });
});

module.exports = router;
