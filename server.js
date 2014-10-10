var fs = require('fs');
var stormpath = require('stormpath');
var openBrowser = require('open');

var client, application;
var IS_PRODUCTION = process.env.NODE_ENV==='production';
var API_KEY_FILE = process.env.API_KEY_FILE;
var STORMPATH_API_KEY_ID = process.env.STORMPATH_API_KEY_ID;
var STORMPATH_API_KEY_SECRET = process.env.STORMPATH_API_KEY_SECRET;
var STORMPATH_APP_HREF = process.env.STORMPATH_APP_HREF;
var PORT = process.env.PORT || 8001;
var DOMAIN = process.env.DOMAIN || 'local.stormpath.com';
var SSO_SITE_PATH = process.env.SSO_SITE_PATH || '';
var CB_URI = process.env.CB_URI || ('http://' + DOMAIN + ':' + PORT);


var express = require('express');
var app = express();
var sessions = require('client-sessions');
app.use(sessions({
  cookieName: 'sp', // cookie name dictates the key name added to the request object
  secret: STORMPATH_API_KEY_SECRET, // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));

app.get('/', function(req, res){
  if(req.query.jwtResponse){
    application.handleIdSiteCallback(req.url,function(err,idSiteResult){
      if(err){
        res.writeHead(500, {
          'Cache-Control': 'no-store',
          'content-type': 'text/html',
          'Pragma': 'no-cache'
        });
        res.end(fs.readFileSync('error.html').toString().replace('ERROR',err));
      }else{
        req.sp.accountHref = idSiteResult.account.href;
        res.redirect('/');
      }
    });
  }else if(req.sp && req.sp.accountHref){
    client.getAccount(req.sp.accountHref,function(err,account){
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
});

app.get('/login', function(req, res){
  res.writeHead(302, {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Location': application.createIdSiteUrl({
      callbackUri: CB_URI,
      path: SSO_SITE_PATH
    })
  });
  res.end();
});

app.get('/logout', function(req, res){

  if(req.query.jwtResponse){
    res.writeHead(302, {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Location': '/'
    });
    res.end();
  }else{
    req.sp.destroy();
    res.writeHead(302, {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Location': application.createIdSiteUrl({
        callbackUri: CB_URI + '/logout',
        logout: true
      })
    });
    res.end();
  }
});



function startServer(){
  console.log('attempt to start server on port ' + PORT);
  app.listen(PORT,function(){
    console.log('Server running on port '+PORT);
    if(!IS_PRODUCTION){
      openBrowser('http://'+DOMAIN+':'+PORT);
    }
  });

}

function getApplication(then){
  client.getApplication(STORMPATH_APP_HREF,function(err,a){
    if (err){
      throw err;
    }
    application = a;
    then();
  });
}

if(API_KEY_FILE){
  stormpath.loadApiKey(API_KEY_FILE, function apiKeyFileLoaded(err, apiKey) {
    if (err){
      throw err;
    }
    client = new stormpath.Client({apiKey: apiKey});
    getApplication();
  });
}else{
  client = new stormpath.Client({
    apiKey: new stormpath.ApiKey(
      STORMPATH_API_KEY_ID,
      STORMPATH_API_KEY_SECRET
    )
  });
  getApplication(startServer);
}