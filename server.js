const _ = require('lodash');
const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const { Strategy, Issuer, generators, custom } = require('openid-client');
const port = 8000;
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static('photos'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'secret squirrel', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

let client;
const config = {
  issuer: 'http://localhost:1234',
  clientId: 'foo',
  clientSecret: 'bar',
  scope: 'openid',
  callbackURL: 'http://localhost:8000/callback'
};


app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

app.get('/home', checkAuthentication, (req, res) => {
  res.cookie('user', _.get(req, [ 'session', 'passport', 'user', 'userinfo', 'sub' ]));
  res.sendFile('src/home.html', { root: __dirname });
});


const httpsServer = http.createServer(app).listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});


Issuer.discover(config.issuer)
.then(issuer => {
  client = new issuer.Client({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    token_endpoint_auth_method: 'client_secret_post'
  });

  const passReqToCallback = false,
    params = {
      client_id: config.clientId,
      redirect_uri: config.callbackURL,
      scope: config.scope
    };

  passport.use('oidc', new Strategy({
    client,
    params,
    usePKCE: 'S256',
    passReqToCallback
  }, (tokenset, userinfo, done) => {
    tokenset.userinfo = userinfo;
    return done(null, tokenset);
  }));
});


passport.serializeUser((user, done) => {
  done(null, user);
});


passport.deserializeUser((obj, done) => {
  done(null, obj);
});


function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
}


app.get('/login', passport.authenticate('oidc', {
  successReturnToOrRedirect: '/home',
  scope: config.scope
}));


app.get('/callback', passport.authenticate('oidc', {
  callback: true,
  successReturnToOrRedirect: '/home',
  failureRedirect: '/'
}));
