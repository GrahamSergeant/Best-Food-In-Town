//next TODO
//sort alphabetised list by rating button
//food type filter
//display menu
//search foursquare queries for even more data to display
//put tip/username/photo on one line
//test responsive scaling - make flexbox
//add powered by Googlemaps and Foursquare badges
//double marker size
//centre map bounds on selected restaurant
//write readme file


//Foursquare API keys
const CLIENT_ID = config.CLIENT_ID;
const CLIENT_SECRET = config.CLIENT_SECRET;
//ko bound viewmodel - called in init() function
let ViewModel = function() {
  //coerce value of this
  let self = this;
  //set ko bound splash logo to visible
  this.showSplash = ko.observable (true);
  //declare restaurant array, ko bound to restaurant list element in html
  this.placeList = ko.observableArray ([]);
  //data collection - pushed out to various map api calls and updated on return
  let map;
  let markers = [];
  //pull initial restaurant data from prepared object in place_data.js
  //push each restaurant entry in places object to ko bound list element and Foursquare api
  places().forEach(function(restaurant){
        fakeFoursquareQuery(restaurant.name).then(function(response){
          markers.push(addPlaceMarker(response, map));
          restaurant.rating = response.rating;
          self.placeList.push(restaurant);
        });
    });
      
  //
  //bounce marker of selected restaurant
  this.bounceRestaurantMarker = function(restaurant) {
      //find selected restaurant marker and toggle bounce
      markers.find(function(marker){
        if(marker.title === restaurant.name){
          markerBounceToggle(marker);
          setTimeout(markerBounceToggle(marker),2000);
        }
      });
  };
  //initial map set up - called once
  function mapInit(){
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: {lat: 52.4813098, lng: -1.9156044},
      mapTypeControl: false,
      styles: mapStyle()
    });
  }
  //remove splash screen
  setTimeout(function(){self.showSplash(false);},1500);
  //initialise map
  mapInit();
  //
};

//google map API callback/loaded in html file
function init(){
  ko.applyBindings(new ViewModel());
}

//spoof api call with prepared json data
function fakeFoursquareQuery(query){
  let uri;
  if(query === 'Digbeth Dining Club'){
    uri = 'https://api.myjson.com/bins/yckbu';
  }
  if(query === 'Adams'){
    uri = 'https://api.myjson.com/bins/6v03m';
  }
  if(query === 'The Highfield'){
    uri = 'https://api.myjson.com/bins/1e8u6i';
  }
  if(query === 'Fiesta del Asado'){
    uri = 'https://api.myjson.com/bins/o3wq2';
  }
  if(query === 'Damascena'){
    uri = 'https://api.myjson.com/bins/1dajm2';
  }
  return new Promise(function(resolve,reject){
      fetch(uri).then(function(result) {
        (result.json()).then(function(jsonResult){
          resolve(jsonResult);
        }).catch(function(error){
          reject(alert('Failed to fetch and parse JSON data in fake API call' + error));
        });
      });
    });
}

//genuine api call to foursquare - query argument is restaurant name
function foursquareQuery(query){
  return new Promise(function(resolve,reject){
    //initial, shallow foursquare place search to get venue id from name and birmingham lat/lng area query
    fetch(`https://api.foursquare.com/v2/venues/explore?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&v=20180323&ll=52.4813098,-1.9156044&query=${query}`)
      .then(function(result) {
        (result.json()).then(function(jsonResult){
        //deeper foursquare venue/details search with venue id
        let VENUE_ID = jsonResult.response.groups[0].items[0].venue.id;
        fetch(`https://api.foursquare.com/v2/venues/${VENUE_ID}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&v=20180323`)
        .then(function(result){
          (result.json()).then(function(jsonResult){
              resolve(jsonResult.response.venue);
          });
        }).catch(function(error) {
            alert('FourSquare venue/details serarch failed with error: ' + error);
          });
        });
    })
    .catch(function(error) {
      alert('FourSquare venue search failed with error: ' + error);
    });
  });
}

function addPlaceMarker(venue, map){
  let lat = venue.location.lat;
  let lng = venue.location.lng;
  let location = {lat,lng};
  let marker = new google.maps.Marker({
      map: map,
      icon: 'img/bfit_map_pin.png',
      title: venue.name,
      position: location,
    });
  let placeInfoWindow = new google.maps.InfoWindow();
  marker.addListener('click', function() {
    if (placeInfoWindow.marker != this) {
          markerBounceToggle(this);
          setTimeout(markerBounceToggle(marker),2000);
          openInfoWindow(this, placeInfoWindow, venue, map);
    }
  });
  return (marker);
}

function openInfoWindow(marker, infowindow, venue, map) {
    infowindow.marker = marker;
    let innerHTML = '<div id=' + 'infowindow_container' + '>' + '<div id=' + 'infowindow' + '>';
    if (venue.name){
      innerHTML += '<strong>' + venue.name + '</strong>';
    }
    if (venue.location.formattedAddress){
      innerHTML += '<br>' + venue.location.formattedAddress;
    }
    if (venue.contact.formattedPhone){
    innerHTML += '<br>' + venue.contact.formattedPhone;
    }
    if (venue.rating){
      innerHTML += '<br>' + '<strong>Average Rating: </strong>' + venue.rating;
    }
    if (venue.tips.groups[0].items[0].user && venue.tips.groups[0].items[0].text) {
      innerHTML += '<br>' + '<strong>' + venue.tips.groups[0].items[0].user.firstName + ' ' + venue.tips.groups[0].items[0].user.lastName + '\'s tip: ' + '</strong>' + ' ' + venue.tips.groups[0].items[0].text;
    }
    if (venue.tips.groups[0].items[0].photo) {
      let photoPrefix = venue.tips.groups[0].items[0].photo.prefix
      let photoSuffix = venue.tips.groups[0].items[0].photo.suffix
      let photoURL = photoPrefix + '100x100' + photoSuffix;
        innerHTML += '<br><br><img src="' + photoURL + '">';
      }
    innerHTML += '</div>' + '</div>';
    infowindow.setContent(innerHTML);
    infowindow.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
}


function markerBounceToggle(marker){
  if (marker.getAnimation()) {
    marker.setAnimation(null);
  } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function sortList(list){
  //add first result into sorted array to compare against
  let sortedList = [list[0]];
  //compare each results rating against sortedArray rating
  for(let i = 1; i < list.length;i++){
    for(let j = 0; j < sortedList.length;j++){
      //if rating is more than or equal to rating, splice into array at that position
      if (list[i].rating >= sortedList[j].rating){
        sortedList.splice(j,0,list[i]);
        break;
        //else, push to end if not more than or equal to any rating tested
      } else if (j === sortedList.length - 1){
          sortedList.push(list[i]);
          break;
        }
    }
  }
  return(sortedList);
}



/*

//bounce marker of selected restaurant
  this.bounceRestaurantMarker = function(restaurant) {
    //prevent selection of same resturant again
    if (restaurant != selectedRestaurant){
      selectedRestaurant = restaurant;
      find selected restaurant marker and toggle bounce
      markers.find(function(marker){
        if(marker.title === restaurant.name){
          markerBounceToggle(marker);
          setTimeout(markerBounceToggle(marker),2000);
        }
      });
    }
  };

function getPlaceID(map,location,query){
  return new Promise(function(resolve,reject){
    let request = {
      locationBias: location,
      query: query,
      fields: ['place_id']
    };
    placesServiceCall = new google.maps.places.PlacesService(map);
    placesServiceCall.findPlaceFromQuery(request,placesSearchResults);
    function placesSearchResults(results,status){
      if(status==='OK'){
        resolve(results);
      } else alert('Google Place Query has failed: '+status);
    }
  });
}

function addPlaceMarkers(places,map){
  let markers = [];
  places.forEach(function(place){
    let lat = place.lat;
    let lng = place.lng;
    let location = {lat,lng};
    getPlaceID(map,location,place.name).then(function(response){
        let id = response[0].place_id;
        let marker = new google.maps.Marker({
          map: map,
          icon: 'img/bfit_map_pin.png',
          title: place.name,
          position: location,
          id: id
        });
        markers.push(marker);
        let placeInfoWindow = new google.maps.InfoWindow();
        marker.addListener('click', function() {
          if (placeInfoWindow.marker != this) {
            openInfoWindow(this, placeInfoWindow, map);
          }
        });
    }).catch(function(error){
      alert('Google Place Query has failed with error: '+error);
    });
    return (markers);
  });
}

function openInfoWindow(marker, infowindow, map) {
  let service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      infowindow.marker = marker;
      let innerHTML = '<div id=' + 'infowindow_container'+ '>' +
                          '<div id='+'infowindow'+'>';
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
        innerHTML += '<br>' + '<strong>Customer Reviews: </strong>';
        place.reviews.forEach(function(review){
          innerHTML += '<br>' + '<strong>' + review.author_name + '. Rating: ' + review.rating + '</strong>' + ' ' + review.text;
        })
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl({maxHeight: 100, maxWidth: 200}) + '">';
      }
      innerHTML += '</div>' + '</div>';
      //
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
*/

