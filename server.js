var express = require('express');
var nJwt = require('njwt');
var openBrowser = require('open');
var sessions = require('client-sessions');
var stormpath = require('stormpath');


var IS_PRODUCTION = process.env.NODE_ENV==='production';
var PORT = process.env.PORT || 8001;
var DOMAIN = process.env.DOMAIN || 'stormpath.localhost';
var ID_SITE_PATH = process.env.ID_SITE_PATH || '';
var CB_URI = process.env.CB_URI || ('http://' + DOMAIN + ':' + PORT + '/idSiteCallback' );

var app = express();
var application;
var client = new stormpath.Client();

app.set('views', './views');
app.set('view engine', 'jade');


var spCookieInterface = sessions({
  cookieName: 'sp', // cookie name dictates the key name added to the request object
  secret: 'will be set after client initialization', // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
});

var lastJwtCookieInterface = sessions({
  cookieName: 'lastJwt', // cookie name dictates the key name added to the request object
  secret: 'will be set after client initialization', // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
});

app.use(lastJwtCookieInterface);
app.use(spCookieInterface);

app.get('/', function(req, res){
  if(req.sp && req.sp.accountHref){
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

app.get('/idSiteCallback',function(req,res){
  if(req.query.jwtResponse){
    application.handleIdSiteCallback(req.url,function(err,idSiteResult){
      if(err){
        res.render('error',{
          errorText: JSON.stringify(err)
        });
      }else{
        if(idSiteResult.status !== 'LOGOUT'){
          req.sp.accountHref = idSiteResult.account.href;
        }
        req.lastJwt.value = nJwt.verify(req.query.jwtResponse,client.config.apiKey.secret);
        res.redirect('/');
      }
    });
  }
});

app.get('/login', function(req, res){

  var options = {
    callbackUri: CB_URI,
    path: ID_SITE_PATH
  };

  if(req.query.sof){
    options.showOrganizationField = Boolean(parseInt(req.query.sof,10));
  }

  if(req.query.onk){
    options.organizationNameKey = req.query.onk;
  }

  if(req.query.usd){
    options.useSubDomain = true;
  }

  if(req.query.state){
    options.state = req.query.state;
  }

  if(req.query.path){
    options.path = req.query.path;
  }

  res.redirect(application.createIdSiteUrl(options));
  res.end();
});

app.get('/logout', function(req, res){
  req.sp.destroy();
  res.redirect(application.createIdSiteUrl({
    callbackUri: CB_URI,
    logout: true
  }));
});




function startServer(){
  lastJwtCookieInterface.secret = client.config.apiKey.secret;
  spCookieInterface.secret = client.config.apiKey.secret;
  console.log('Starting server on port ' + PORT);
  app.listen(PORT,function(){
    console.log('Server running');
    if(!IS_PRODUCTION){
      openBrowser('http://'+DOMAIN+':'+PORT);
    }
  });

}

function getApplication(then){
  client.getApplication(client.config.application.href,function(err,a){
    if (err){
      throw err;
    }
    application = a;
    then();
  });
}


client.on('ready',function(){
  getApplication(startServer);
});

