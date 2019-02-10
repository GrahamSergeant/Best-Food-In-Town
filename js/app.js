let myViewModel = {
  
};


function init(){
  ko.applyBindings(myViewModel);
  
  const myLatLng = {lat: 40.758895, lng: -73.9873197};
  let map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: myLatLng,
      mapTypeControl: false
  });
  if (navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(function (position) {
         myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
         map.setCenter(myLocation);
     });
 }

}
