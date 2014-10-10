var fs = require('fs');
var stormpath = require('stormpath');
var openBrowser = require('open');
var jwt = require('jwt-simple');
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
app.set('views', './views');
app.set('view engine', 'jade');
var sessions = require('client-sessions');
app.use(sessions({
  cookieName: 'sp', // cookie name dictates the key name added to the request object
  secret: STORMPATH_API_KEY_SECRET, // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));
app.use(sessions({
  cookieName: 'lastJwt', // cookie name dictates the key name added to the request object
  secret: STORMPATH_API_KEY_SECRET, // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));

app.get('/', function(req, res){
  if(req.query.jwtResponse){
    application.handleIdSiteCallback(req.url,function(err,idSiteResult){
      if(err){
        res.render('error',{
          errorText: String(err)
        });
      }else{
        req.sp.accountHref = idSiteResult.account.href;
        req.lastJwt.value = jwt.decode(req.query.jwtResponse,STORMPATH_API_KEY_SECRET);
        res.redirect('/');
      }
    });
  }else if(req.sp && req.sp.accountHref){
    client.getAccount(req.sp.accountHref,function(err,account){
      if(err){
        res.render('error',{
          errorText: String(err)
        });
      }else{
        res.render('index',{
          lastJwt: req.lastJwt.value ? JSON.stringify(req.lastJwt.value,null,2) : null,
          account: account,
          accountJson: JSON.stringify(account,null,2)
        });
      }
    });
  }else{
    res.render('index',{
      lastJwt: req.lastJwt.value ? JSON.stringify(req.lastJwt.value,null,2) : null,
      account: null
    });
  }
});

app.get('/login', function(req, res){
  res.redirect(application.createIdSiteUrl({
    callbackUri: CB_URI,
    path: SSO_SITE_PATH
  }));
  res.end();
});

app.get('/logout', function(req, res){
  if(req.query.jwtResponse){
    req.lastJwt.value = jwt.decode(req.query.jwtResponse,STORMPATH_API_KEY_SECRET);
    res.redirect('/');
    res.end();
  }else{
    req.sp.destroy();
    res.redirect(application.createIdSiteUrl({
      callbackUri: CB_URI + '/logout',
      logout: true
    }));
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