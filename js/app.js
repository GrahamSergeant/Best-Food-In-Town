//next TODO
//style infowindows
//bind marker select to list select
//add warning for invalid query radius
//add UI to specify travel mode
//test responsive scaling

let ViewModel = function() {
  //
  let self = this;
  let location = {lat: 40.758895, lng: -73.9873197}; //NYC for splash screen
  let map;
  let markers = [];
  let userMarker;
  let route;
  let selectedRestaurant;
  let restaurantMarker;
  //
  this.radius = ko.observable();
  this.orderedList = ko.observableArray ([]);
  this.showSplash = ko.observable (true);
  this.toggleUI = ko.observable(false);
  //perform a new place search with new radius input
  this.radiusUpdate = function(){
    mapUpdate();
  };
  //draw route to selected restaurant
  this.restaurantSelected = function(restaurant) {
    //prevent selection of same resturant again
    if (restaurant != selectedRestaurant){
      selectedRestaurant = restaurant;
      //remove route from last selection
      if (route){
        route.setMap(null);
        markerBounceToggle(restaurantMarker);
      }
      //return promise from directions service API for new route
      displayRoute(restaurant.geometry.location,map,location).then(function(result){
        route = result;
        //find selected restaurant marker and toggle bounce
        restaurantMarker = markers.find(function(marker){
          if(marker.title === restaurant.name){
            return (marker);
          }
        });
        markerBounceToggle(restaurantMarker);
      });
    }
  };
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
        userMarker = addUserMarker(map,location);
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

function addUserMarker(map,location){
    let userMarker = new google.maps.Marker({
      map: map,
      icon: 'img/user_map_pin.png',
      title: 'Your Location',
      position: location,
      animation: google.maps.Animation.BOUNCE
    });
    return (userMarker);
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
  //add infowindows on click events for each marker
  markers.forEach(function(marker){
    let placeInfoWindow = new google.maps.InfoWindow();
    marker.addListener('click', function() {
      if (placeInfoWindow.marker != this) {
        openInfoWindow(this, placeInfoWindow, map);
      }
    });
  });
  return (markers);
}


function openInfoWindow(marker, infowindow, map) {
  let service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      infowindow.marker = marker;
      let innerHTML = '<div>';
      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        innerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.rating) {
        innerHTML += '<br>' + '<strong>Average Rating: </strong>' + place.rating;
      }
      if (place.reviews) {
        place.reviews.forEach(function(review){
          innerHTML += '<br>' + '<strong>Customer Reviews: </strong>' + '<br>' + '<strong>' + review.author_name + '. Rating: ' + review.rating + '</strong>' + ' ' + review.text;
        })
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl({maxHeight: 100, maxWidth: 200}) + '">';
      }
      innerHTML += '</div>';
      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
    }
  });
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
  if (marker.getAnimation()) {
    marker.setAnimation(null);
  } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

