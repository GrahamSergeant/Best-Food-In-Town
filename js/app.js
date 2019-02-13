let myViewModel = {
  
};


function initMap(){
  //ko.applyBindings(myViewModel);
  const myLatLng = {lat: 40.758895, lng: -73.9873197};
  let map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center: myLatLng,
      mapTypeControl: false,
      styles: mapStyle()
  });
  toggleSplash();
  let location = centreMapOnUserLocation(map);
}

function centreMapOnUserLocation(map){
  if (navigator.geolocation) {
    let geolocationPromise = new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(function (position) {
        let myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
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
        resolve(myLocation);
        reject(status);
        setTimeout(function() { markerBounceToggle(userMarker) },3000);
        toggleSplash();
      });
    });
    geolocationPromise.then(function(myLocation){
      placesSearch(map,myLocation);
    }).catch(function(status){
      alert(status);
    });
  }
}

function placesSearch(map,location){
  let request = {
    location: location,
    radius: '5000',
    type: ['restaurant']
  }
  placesServiceCall = new google.maps.places.PlacesService(map);
  placesServiceCall.nearbySearch(request,placesSearchResults);
  function placesSearchResults(results,status){
    if(status==='OK'){
      let sortedResults = sortResults(results);
      //addMarkers(sortedResults,map)
      addMarkers([sortedResults[0]],map)
      displayRoute(location,sortedResults[0].geometry.location,map)
    } else alert('Search Result: '+status+' ...hit refresh to try again');
  }
}

function sortResults(results){
  //add first result into sorted array to compare against
  let sortedArray =[results[0]];
  //compare each results rating against sortedArray rating
  for(let i = 1; i < results.length;i++){
    for(let j = 0; j < sortedArray.length;j++){
      //if rating is more than or equal to rating, splice into array at that position
      if (results[i].rating >= sortedArray[j].rating){
        sortedArray.splice(j,0,results[i]);
        break;
        //else, push to end if not more than or equal to any rating tested
      } else if (j === sortedArray.length - 1){
          sortedArray.push(results[i]);
          break;
        }
    }
  }
  return(sortedArray);
}

function addMarkers(results,map){
  for (i = 0; i < results.length; i++){
    let marker = new google.maps.Marker({
      map: map,
      icon: 'img/bfit_map_pin.png',
      title: results[i].name,
      position: results[i].geometry.location,
      id: results[i].place_id
    });
  }
}

function displayRoute(origin,destination,map) {
  let directionsServiceCall = new google.maps.DirectionsService;
  directionsServiceCall.route({
    origin: origin,
    destination: destination,
    travelMode: 'WALKING',
  }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
          let directionsDisplay = new google.maps.DirectionsRenderer({
              map: map,
              directions: response,
              draggable: true,
              polylineOptions: {strokeColor: 'red'},
              preserveViewport: true,
              markerOptions: {visible:false}
          });
        } else {
            window.alert('Directions request failed due to ' + status);
          }
      });
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

