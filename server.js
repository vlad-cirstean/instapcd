const express = require('express')
const app = express();
const path = require('path');
const port = 8000;
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static('photos'));

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: __dirname});
});

app.get('/home', (req, res) => {
  res.sendFile('src/home.html', {root: __dirname});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});