const firebaseConfig = {
  apiKey: "AIzaSyAXWzJkAvZfSnkhJoYeooXVX4qoW0jvyWI",
  authDomain: "cadeprima-d86ad.firebaseapp.com",
  databaseURL: "https://cadeprima-d86ad-default-rtdb.firebaseio.com",
  projectId: "cadeprima-d86ad",
  storageBucket: "cadeprima-d86ad.firebasestorage.app",
  messagingSenderId: "31857695670",
  appId: "1:31857695670:web:6222da2148493ecb453f17"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let map;
let userMarker;
let markers = [];

function initMapUser() {
  // Começa centralizado no Brasil
  map = L.map('map').setView([-14.2350, -51.9253], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  function onLocationFound(e) {
    const radius = e.accuracy / 2;
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker(e.latlng).addTo(map)
      .bindPopup("Você está aqui").openPopup();
    L.circle(e.latlng, radius).addTo(map);
    map.setView(e.latlng, 18); // Zoom máximo ao localizar
  }

  function onLocationError(e) {
    alert(e.message);
  }

  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);
  map.locate({ setView: false, watch: true });

  const pointsRef = db.ref('points');
  pointsRef.on('value', (snapshot) => {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    snapshot.forEach((childSnapshot) => {
      const point = childSnapshot.val();
      const marker = L.marker([point.lat, point.lng]).addTo(map);
      marker.bindPopup(`<b>${point.title}</b><br>${point.comment}`);
      markers.push(marker);
    });
  });
}

function initMapAdmin() {
  map = L.map('map').setView([-23.5505, -46.6333], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  let tempMarker = null;
  map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([lat, lng]).addTo(map);
    document.getElementById('title').dataset.lat = lat;
    document.getElementById('title').dataset.lng = lng;
  });
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch((error) => {
      alert('Erro ao fazer login: ' + error.message);
    });
}

function addPoint() {
  const title = document.getElementById('title').value;
  const comment = document.getElementById('comment').value;
  const lat = parseFloat(document.getElementById('title').dataset.lat);
  const lng = parseFloat(document.getElementById('title').dataset.lng);
  if (title && comment && lat && lng) {
    db.ref('points').push({
      title: title,
      comment: comment,
      lat: lat,
      lng: lng
    }).then(() => {
      document.getElementById('title').value = '';
      document.getElementById('comment').value = '';
      delete document.getElementById('title').dataset.lat;
      delete document.getElementById('title').dataset.lng;
    });
  } else {
    alert('Preencha todos os campos e clique no mapa para selecionar a localização.');
  }
}

function loadPoints() {
  const pointsRef = db.ref('points');
  pointsRef.on('value', (snapshot) => {
    const pointsList = document.getElementById('points-list');
    pointsList.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
      const point = childSnapshot.val();
      const li = document.createElement('li');
      li.innerHTML = `${point.title} - ${point.comment} <button onclick="deletePoint('${childSnapshot.key}')">Excluir</button>`;
      pointsList.appendChild(li);
    });
  });
}

function deletePoint(key) {
  db.ref('points/' + key).remove();
}
