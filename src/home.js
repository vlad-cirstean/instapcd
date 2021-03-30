var client = new WebSocket('ws://35.222.18.182:9000/');

client.onerror = function () {
  console.log('Connection Error');
};

client.onopen = function () {
  console.log('WebSocket Client Connected');

  function sendNumber() {
    if (client.readyState === client.OPEN) {
      var number = Math.round(Math.random() * 0xFFFFFF);
      client.send(number.toString());
      setTimeout(sendNumber, 1000);
    }
  }

  // sendNumber();
};

client.onclose = function () {
  console.log('echo-protocol Client Closed');
};

client.onmessage = function (e) {
  if (typeof e.data === 'string') {
    console.log('Received: \'' + e.data + '\'');
  }
  init();
};

$(document).ready(function (e) {
  $('#uploadImage').on('submit', (function (e) {
    e.preventDefault();
    var formData = new FormData(this);
    formData.append('user', getUser());
    alert('done!');
    $.ajax({
      type: 'POST',
      url: 'https://premium-state-307816.ew.r.appspot.com/upload_image',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: function (data) {
        console.log('success');
        console.log(data);
      },
      error: function (data) {
        console.log('error');
        console.log(data);
      }
    });
  }));

});

function getUser() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; user=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function setUser() {
  document.getElementById('user').innerText = getUser();
}

setUser();

const baseUrl = 'http://35.222.18.182:8000';

async function init() {
  $('#images-id').empty();
  const res = await fetch(`${baseUrl}/getImages`);
  const images = await res.json();
  images.forEach(i => {
      $('#images-id').append(`<div class="card center-block"><img src="${baseUrl + '/images/' + i}" class="img-responsive center-block" /></div>`);
    }
  );
}

init();
