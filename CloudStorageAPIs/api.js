const firebase = require("firebase");
require("firebase/firestore");

var express = require('express');
var app = express();

var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

const {Storage} = require('@google-cloud/storage');
// Creates a client
const storage = new Storage();

var firebaseConfig = {
    apiKey: "AIzaSyAqTvpII_7ku7pTDkNS9G5I_VqV-pUv59A",
    authDomain: "premium-state-307816.firebaseapp.com",
    projectId: "premium-state-307816",
    storageBucket: "premium-state-307816.appspot.com",
    messagingSenderId: "980649016500",
    appId: "1:980649016500:web:8fde18204c96adbf0debe1",
    measurementId: "G-5GP5JGF8PW"
};

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();



function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

//POST images
app.post('/upload_image', async function(req, res){
    //bucket -> image
    rand_name = getRandomInt(1000000).toString();
    
    await storage.bucket('pcd-bucket-1').upload("test.png", {
        destination: rand_name,
    });
    console.log(rand_name.toString());
    // console.log(`${req.body.photo} uploaded to ${'pcd-bucket1'}`);

    //firestore -> metadata
    const data = {
        used_id: 'id',
        date: Date.now()
    };
    
    const res1 = await db.collection('photos').doc(rand_name).set(data);

    res.end();
});


//GET images
const myBucket = storage.bucket('pcd-bucket-1');

app.get('/getall', async function(req, res){
    const photos = db.collection('photos');
    const last_photos = await photos.orderBy('date', 'desc').get();

    var photo_list = [];

    last_photos.forEach(doc => {
        const file = myBucket.file(doc.id);

        const options = {
            destination: doc.id + ".png",
        };

        var fileObj;
        file.download(options);
        photo_list.push(fileObj);
        
    });

    res.send(photo_list);
    
});


//OBSERVER
const observer = db.collection('photos')
  .onSnapshot(querySnapshot => {
    querySnapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        // action on added photo
      }
      if (change.type === 'modified') {
        // action on modified photo
      }
      if (change.type === 'removed') {
        // action on deleted photo
      }
    });
  });

const port = 8000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});