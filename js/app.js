let myViewModel = {
  
};


function initMap(){
  //ko.applyBindings(myViewModel);
  const myLatLng = {lat: 40.758895, lng: -73.9873197};
  let map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: myLatLng,
      mapTypeControl: false,
      styles: mapStyle()
  });
  toggleSplash();
  centreMapOnUserLocation(map);
}

function centreMapOnUserLocation(map){
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map.setCenter(myLocation);
      //
      let userMarker = new google.maps.Marker({
        map: map,
        icon: 'img/user_map_pin.png',
        title: 'Your Location',
        position: myLocation,
        animation: google.maps.Animation.BOUNCE
      });
      //
      setTimeout(function() { markerBounceToggle(userMarker) },3000)
      toggleSplash();
    });
 }
}

function markerBounceToggle(marker){
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function toggleSplash(){
  if(document.getElementById('splash').className != 'hidden'){
    document.getElementById('splash').className = 'hidden';
    } else document.getElementById('splash').className = 'visible';
}

