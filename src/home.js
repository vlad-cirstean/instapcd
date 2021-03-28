var client = new WebSocket('ws://localhost:9000/', 'echo-protocol');

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

  sendNumber();
};

client.onclose = function () {
  console.log('echo-protocol Client Closed');
};

client.onmessage = function (e) {
  if (typeof e.data === 'string') {
    console.log('Received: \'' + e.data + '\'');
  }
};

$(document).ready(function (e) {
  alert('hello!');
  $('#uploadImage').on('submit', (function (e) {
    e.preventDefault();
    var formData = new FormData(this);
    formData.append('user', getUser());
    alert('catched!');
    $.ajax({
      type: 'POST',
      url: '', //$(this).attr('action')
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
