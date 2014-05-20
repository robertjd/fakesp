var http = require('http');
var fs = require('fs');
var url = require('url');
var stormpath = require('stormpath');


var client, application;
var API_KEY_FILE = process.env.API_KEY_FILE;
var APP_HREF = process.env.APP_HREF;
var PORT = process.env.PORT || 8001;
var DOMAIN = process.env.DOMAIN || 'local.stormpath.com';
var IP = process.env.IP  || '0.0.0.0';

stormpath.loadApiKey(API_KEY_FILE, function apiKeyFileLoaded(err, apiKey) {
  if (err){
    throw err;
  }
  client = new stormpath.Client({apiKey: apiKey});
  client.getApplication(APP_HREF,function(err,a){
    if (err){
      throw err;
    }
    application = a;
  });
});

http.createServer(function (req, res) {
  console.log(req.headers.host,req.method,req.headers['content-type'] || '',req.url);
  var params = url.parse(req.url,true).query;
  if(req.url==='/login'){
    res.writeHead(302, {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Location': application.createSsoUrl({
        cb_uri: 'http://' + DOMAIN + ':' + PORT,
        path: ':9000/',
        state: 'whaaatuppp'
      })
    });
    res.end();
  }else if(params.jwtResponse){
    application.parseSsoResponse(req.url,function(err,account){
      if(err){
        res.writeHead(500, {
          'Cache-Control': 'no-store',
          'content-type': 'text/html',
          'Pragma': 'no-cache'
        });
        res.end(fs.readFileSync('error.html').toString().replace('ERROR',err));
      }else{
        res.writeHead(200, {
          'Cache-Control': 'no-store',
          'content-type': 'text/html',
          'Pragma': 'no-cache'
        });
        res.end(fs.readFileSync('account.html').toString().replace('ACCOUNT',JSON.stringify(account,null,2)));
      }
    });
  }else{
    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'content-type': 'text/html',
      'Pragma': 'no-cache'
    });
    res.end(fs.readFileSync('index.html'));
  }
}).listen(PORT, IP);

console.log('Server running at http://'+IP+':/'+PORT);
