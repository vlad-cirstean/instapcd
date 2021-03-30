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
const storage = new Storage({ keyFilename: './keys.json' });

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


const WebSocket = require('ws');

const WS_PORT = 9000;

const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));

// array of connected websocket clients
let connectedClients = [];

wsServer.on('connection', (ws, req) => {
  console.log('Connected');
  // add new connected client
  connectedClients.push(ws);
  // listen for messages from the streamer, the clients will not send anything so we don't need to filter
  ws.on('message', data => {
    // send the base64 encoded frame to each connected ws
    connectedClients.forEach((ws, i) => {
      if (ws.readyState === ws.OPEN) { // check if it is still connected
        ws.send(data); // send
      } else { // if it's not connected remove from the array of connected ws
        connectedClients.splice(i, 1);
      }
    });
  });
});

let lastArray = [];
setInterval(async () => {
  const last_photos = await photos.orderBy('date', 'desc').get();

  var photo_list = [];

  last_photos.forEach(doc => {
    photo_list.push(doc.id);
  });

  const diff = _.difference(photo_list, lastArray);
  if (diff.length) {
    lastArray = photo_list;
    connectedClients.forEach(i => {
      i.send('update');
    });
  }
}, 1000);
