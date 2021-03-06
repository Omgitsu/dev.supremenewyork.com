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
  * unexpected redirects
  
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
var ERROR_CODES = [   {200: 'OK',                    'delay': 3 * 1000},
                      {400: 'Bad Request',           'delay': 1 * 1000},
                      {401: 'Unauthorized',          'delay': 0 * 1000},
                      {403: 'Forbidden',             'delay': 0 * 1000},
                      {404: 'Not Found',             'delay': 0 * 1000},
                      {500: 'Internal Server Error', 'delay': 0 * 1000},
                      {502: 'Bad Gateway',           'delay': 1 * 1000},
                      {503: 'Service Unavailable',   'delay': 5 * 1000},
                      {504: 'Gateway Timeout',       'delay': 5 * 1000},];

const ALLOW_ERRORS = true;
const ERROR_ODDS = 1/2;
const ENABLE_DELAYS = true;
const ENABLE_BLANK_200_RESPONSE = true;
const BROKEN_JSON_ODDS = 1/10;
const MOBILE_STOCK_MISSING_NEW = true;
const OUT_OF_STOCK_ODDS = 1/10;
const ADD_TO_CART_MAX_DELAY = 5 * 1000;
const DROP_WEEK_COUNT = 19;
const DROP_SEASON = 'SS';
const DROP_YEAR = '18';
// const IGNORE_DROP_WEEK = 'false';
const WRONG_DROP_WEEK = '01FW94';
const DEFAULT_DATE = '12/07/2017';
const TARGET_DROP_DATE = '05/5/2017'

function dropWeeks() {
  var drops = []
  for (var i=1; i <= DROP_WEEK_COUNT; i++) {
    var drop = '' + i;
    // if (i < 10) {
    //   drop = 0 + drop;
    // }
    drops.push(drop + DROP_SEASON + DROP_YEAR);
  }
  return drops;
}

let dropWeek = dropWeeks()[0];

var settings = {
  'enable_http_errors': ALLOW_ERRORS,
  'http_error_odds': ERROR_ODDS,
  'enable_blank_200_response': ENABLE_BLANK_200_RESPONSE,
  'enable_delays': ENABLE_DELAYS,
  'broken_json_odds': BROKEN_JSON_ODDS,
  'mobile_stock_missing_new': MOBILE_STOCK_MISSING_NEW,
  'item_in_stock': 'maybe',
  'out_of_stock_odds': OUT_OF_STOCK_ODDS,
  'add_to_cart_max_delay': ADD_TO_CART_MAX_DELAY,
  'drop_weeks': dropWeeks(),
  'target_drop_week': dropWeek,
  'target_drop_date': TARGET_DROP_DATE,
  // 'ignore_drop_week': IGNORE_DROP_WEEK,
  'use_target_drop_week': true,
  'use_target_drop_date': true,
}


console.log(settings);

// ********
// errors
// ********
// MARK:errors

function chooseError() {

  var code = 0;
  var index
  var item
  // if code is empty, or if code==200 and enable_blank_200_response = false
  // keep trying for another code
  do {
    index = Math.floor(Math.random()*ERROR_CODES.length)
    item = ERROR_CODES[index];
    code = parseInt(Object.keys(item)[0]);
  } while(settings.enable_blank_200_response === false && code === 200)

  return item
}

function returnError(res) {

  let item = chooseError()
  const code = Object.keys(item)[0];
  let delay = 0
  if (settings.enable_delays) {
    delay = item.delay;
    console.log(code + ' waiting: ' + delay + 'ms');
  }
  // Supreme's servers don't seem to send a status code for 404s
  if (code === 404) {
    setTimeout(()=>{res.status(200).render('404')}, delay);
    return;
  }
  setTimeout(()=>{res.sendStatus(code)}, delay);
  
}

function sendError(odds) {
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

  if (sendError(settings.http_error_odds)) {
    returnError(res);
  } else {

    let template = 'mobile_stock';

    if (settings.mobile_stock_missing_new) {
      template = 'mobile_stock_no_new';
      console.log('return mobile_stock with no new');
    } else if (sendError(settings.broken_json_odds)) {
      template = 'mobile_stock_broken';
      console.log('return broken json');
    }
    
    let drop_week = WRONG_DROP_WEEK;
    if (settings.use_target_drop_week) {
      drop_week = settings.target_drop_week
    }

    let drop_date = DEFAULT_DATE;
    if (settings.use_target_drop_date) {
      drop_date = settings.target_drop_date
    }

    res.render(template, { 
      layout: false, 
      title: 'dev.supremenewyork.com',
      week: drop_week,
      date: drop_date,
    });
  }
});

/* GET the JSON for a certain item  */
router.get('/shop/:item_id', function(req, res, next) {

  if (sendError(settings.http_error_odds)) {
    returnError(res);
  } else {

    let item_id = req.params.item_id.split('.')[0]
    var template = item_id;
    if (Math.random() <= settings.broken_json_odds) {
      template = 'broken_json';
      console.log('return broken json');
    }

    var stock = 1;
    if (settings.item_in_stock === 'maybe') {
      if (Math.random() <= settings.out_of_stock_odds) {
        stock = 0
      }
    } else if (settings.item_in_stock === 'no') {
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
  POST add to cart page 
  /shop/${itemID}/add
  can throw errors, and can be successful with long delays
*/
router.post('/shop/:item_id/add.json', 

  // Form filter and validation middleware 
  form(
    field("s"),
    field("st"),
    field("qty"),
   ),

  function(req, res, next) {

    if (sendError(settings.http_error_odds)) {
      returnError(res);
    } else {

      // make sure template exists
      // this will mock a bad item_id 
      let item_id = req.params.item_id
      console.log('Form: ', req.form)
      console.log('Cookies: ', req.cookies)

      res.render(item_id, {}, function(err, html) {
        if(err) {
          res.sendStatus(404)
        } else {

          const randomInt = Math.floor(Math.random() * 9999) + 0
          res.cookie('cookieName'+randomInt, randomInt)

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
  console.log('checkout!');
  console.log('Cookies: ', req.cookies)
  res.render('checkout', { 
    layout: false, 
    title: 'CHECKOUT!'
  });

});

router.get('/gmail', function(req, res, next) {
  console.log('Cookies: ', req.cookies)
  const randomInt = Math.floor(Math.random() * 9999) + 0
  res.cookie('cookieName'+randomInt, randomInt, { expires: false, maxAge: 2147483647 })
  // 2147483647
  res.render('index', { title: 'dev.supremenewyork.com' });
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
  mobile_stock_missing_new
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
    field("mobile_stock_missing_new").toBoolean(),
    field("broken_json_odds").trim().required(),
    field("item_in_stock").trim().required(),
    field("out_of_stock_odds").trim().required(),
    field("add_to_cart_max_delay").trim().required(),
    field("target_drop_week").trim().required(),
    // field("ignore_drop_week").toBoolean(),
    field("use_target_drop_week").toBoolean(),
    field("target_drop_date").trim().required(),
    field("use_target_drop_date").toBoolean(),
   ),
 
   // Express request-handler now receives filtered and validated data 
   function(req, res, next){

    const new_settings = {
      'enable_http_errors': req.form.enable_http_errors,
      'http_error_odds': req.form.http_error_odds,
      'enable_blank_200_response': req.form.enable_blank_200_response,
      'enable_delays': req.form.enable_delays,
      'mobile_stock_missing_new': req.form.mobile_stock_missing_new,
      'broken_json_odds': req.form.broken_json_odds,
      'item_in_stock': req.form.item_in_stock,
      'out_of_stock_odds': req.form.out_of_stock_odds,
      'add_to_cart_max_delay': req.form.add_to_cart_max_delay,
      'drop_weeks': dropWeeks(),
      'target_drop_week': req.form.target_drop_week,
      // 'ignore_drop_week': req.form.ignore_drop_week,
      'use_target_drop_week': req.form.use_target_drop_week,
      'target_drop_date': req.form.target_drop_date,
      'use_target_drop_date': req.form.use_target_drop_date,
   }
   settings = new_settings;

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


/* GET fake 2Captcha page. */


router.get('/2captcha/request', function(req, res, next) {
  let message = {"status":1,"request":"1080048194"}
  res.json(message);
});

/* GET fake 2Captcha response page. */
router.get('/2captcha/response', function(req, res, next) {
  let message = {"status":0,"request":"CAPCHA_NOT_READY"}
  // let message = {"status":0,"request":"ERROR_WRONG_CAPTCHA_ID"}
  res.json(message);
});

module.exports = router;
