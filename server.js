const _ = require('lodash');
const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const { Strategy, Issuer } = require('openid-client');
const port = 8000;
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static('photos'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'secret squirrel', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('cors')());

const firebase = require('firebase');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({keyFilename: './keys.json'});

const firebaseConfig = {
  apiKey: 'AIzaSyAqTvpII_7ku7pTDkNS9G5I_VqV-pUv59A',
  authDomain: 'premium-state-307816.firebaseapp.com',
  projectId: 'premium-state-307816',
  storageBucket: 'premium-state-307816.appspot.com',
  messagingSenderId: '980649016500',
  appId: '1:980649016500:web:8fde18204c96adbf0debe1'
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const myBucket = storage.bucket('pcd-bucket-1');
const photos = db.collection('photos');


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

app.get('/home', checkAuthentication, async (req, res) => {
  res.cookie('user', _.get(req, [ 'session', 'passport', 'user', 'userinfo', 'sub' ]));

  res.sendFile('src/home.html', { root: __dirname });
});

app.get('/getImages', checkAuthentication, async (req, res) => {
  const last_photos = await photos.orderBy('date', 'desc').get();

  var photo_list = [];

  last_photos.forEach(doc => {
    photo_list.push(doc.id);
  });

  res.send(photo_list);
});


app.get('/images/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  if (!id) {
    return res.end();
  }
  const file = myBucket.file(id);
  file.createReadStream().pipe(res);
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


var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(9000, function() {
  console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  var connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      connection.sendUTF(message.utf8Data);
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});
