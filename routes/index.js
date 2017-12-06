var express = require('express');
var router = express.Router();



/* GET home page. */
router.get('/mobile_stock.json', function(req, res, next) {
  res.render('mobile_stock', { 
    layout: false, 
    title: 'dev.supremenewyork.com',
    week: '15FW17', // 16FW17
    date: '12/07/2017' // 11/30/2017 or 12/07/2017
  });
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
