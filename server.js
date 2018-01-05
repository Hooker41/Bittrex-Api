(function() {
    var express = require('express');
    var bodyParser = require('body-parser');
    var app = express();
    var favicon = require('serve-favicon');
    var bittrex = require('node-bittrex-api');
    var path = require('path');

    app.set('port', 8080);
    app.use(express.static(__dirname + '/app'));  
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(favicon(path.join(__dirname, 'app/img', 'favicon.ico')))

    app.post('/', function(req, res){
        var paramObj = req.body.dataObj;
        
        if( paramObj.tg_api == 'orderbook'){
            bittrex.getorderbook({ market : 'BTC-LTC', depth : 10, type : 'both' }, function( data, err ) {
                res.send(data);
            });
            
            
        }

        if( paramObj.tg_api == 'ticker'){
            bittrex.getticker( { market : 'BTC-LTC' }, function( data, err ) {
                res.send(data);
            });
        }

        if( paramObj.tg_api == 'markethistory'){
            bittrex.getmarkethistory({ market : 'BTC-LTC' }, function( data, err ) {
                res.send(data);
            });
        }

    });
  
    // connection and express server
    console.log('Connection established');
    app.listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
    });
  
  }).call(this);
  