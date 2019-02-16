//next TODO
//have route update on list selects
//add unit type to query radius
//add infowindows on restaurants
//add warning for invalid query radius
//add UI to specify travel mode
//
let ViewModel = function() {
  //
  let self = this;
  let map;
  let markers = [];
  let location = {lat: 40.758895, lng: -73.9873197};
  let route;
  //
  this.radius = ko.observable();
  this.orderedList = ko.observableArray([]);
  this.showSplash = ko.observable(true);
  this.toggleUI = ko.observable(false);
  //perform a new place search with new radius input
  this.radiusUpdate = function(){
    mapUpdate();
  };
  //draw route to selected restaurant
  this.selectedRestaurant = function(restaurant) {
    if (route){
      route.setMap(null);
    }
    displayRoute(restaurant.geometry.location,map,location).then(function(result){
      route = result
    });
  }
  //initial map set up - called once
  function mapInit(){
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: location,
      mapTypeControl: false,
      styles: mapStyle()
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        self.showSplash(false);
        self.toggleUI(true);
        addUserMarker(map,location);
        map.setCenter(location);
        self.radius(1000);
        mapUpdate(self.radius());
      });
    } else (alert(error +'Current location not found, refresh to try again'));
  }
  //updatable map API calls - called once by mapInit, then repeatedly by UI inputs
  function mapUpdate(){
    placesSearch(map,location,self.radius()).then(function(results){
      self.orderedList([]);
      sortResults(results).forEach(function(result){
        self.orderedList.push(result);
    });
    if (route){
      route.setMap(null);
    }
    if (markers[0]){
      clearMarkers(markers);
    }
    markers = addPlaceMarkers(self.orderedList(),map);
    }).catch(function(error) {
        alert(error +'No places found, try expanding query radius');
      });
  }
  mapInit();
};


function init(){
  ko.applyBindings(new ViewModel());
}

function addUserMarker(map,location){
    let userMarker = new google.maps.Marker({
      map: map,
      icon: 'img/user_map_pin.png',
      title: 'Your Location',
      position: location,
      animation: google.maps.Animation.BOUNCE
    });
    setTimeout(function(){markerBounceToggle(userMarker)},3000);
}
  
function placesSearch(map,location,radius){
  return new Promise(function(resolve,reject){
    let request = {
      location: location,
      radius: radius,
      type: ['restaurant']
    };
    placesServiceCall = new google.maps.places.PlacesService(map);
    placesServiceCall.nearbySearch(request,placesSearchResults);
    function placesSearchResults(results,status){
      if(status==='OK'){
        resolve(results);
      } else alert('Search Result: '+status+' try increasing query radius');
    }
  });
}

function sortResults(results){
  //add first result into sorted array to compare against
  let sortedArray = [results[0]];
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

function addPlaceMarkers(results,map){
  let markers = [];
  for (i = 0; i < results.length; i++){
    let marker = new google.maps.Marker({
      map: map,
      icon: 'img/bfit_map_pin.png',
      title: results[i].name,
      position: results[i].geometry.location,
      id: results[i].place_id
    });
    markers.push(marker);
  }
  return markers;
}

function clearMarkers(markers){
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function displayRoute(destination,map,location) {
  return new Promise(function(resolve,reject){
    let directionsServiceCall = new google.maps.DirectionsService();
    directionsServiceCall.route({
      origin: location,
      destination: destination,
      travelMode: 'WALKING',
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
          let directionsDisplay = new google.maps.DirectionsRenderer({
              map: map,
              directions: response,
              draggable: true,
              polylineOptions: {strokeColor: 'red'},
              preserveViewport: false,
              markerOptions: {visible:false}
          });
          resolve(directionsDisplay);
        } else {
            window.alert('Directions request failed due to ' + status);
          }
      });
  })
}

function markerBounceToggle(marker){
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

