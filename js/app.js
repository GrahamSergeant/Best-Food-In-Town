//get Foursquare API keys from config.js file
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
  //declare restaurant array, ko bound to restaurant list element in html
  this.categoryList = ko.observableArray (['All']);
  //when category is selected - check which venues are included in the categories array[object] and filter placeList ko array
  this.selectedCategory = ko.observable();
  //update data elements for selected venue:
  this.photoURL = ko.observable();
  this.menuURL = ko.observable();
  this.venuePrice = ko.observable();
  //data collection - pushed out to various map api calls and updated on return
  let map;
  let markers = [];
  let categories = [];
  let filteredCategories = [];
  //keep a master reference to the placelist so when we take out of the places array, we can put back when category is selected
  let apiResponsePlacesArray = [];
  //pull initial restaurant data from prepared object in place_data.js
  places().forEach(function(restaurant){
      //call foursquare api with restaurant name
      fakeFoursquareRestaurantQuery(restaurant.name).then(function(response){
          //keep a single reference to each api call, for rebuilding list and markers after filtering
          apiResponsePlacesArray.push(response);
          //push each restaurant entry in places object to ko bound list element and Foursquare api
          self.placeList.push(response);
          //push venue data to marker, then infowindow
          markers.push(addPlaceMarker(response, map, false));
          //get categories for restaurant-category-filter element
          response.categories.forEach(function(category){
            //populate array of category objects, linking categories to restaurants
            categories.push({
                              category: category.name,
                              restaurants: [response.name]
                            });
            //populate filtered array with single instances of categories, to prevent duplicate <option>s
            if(!filteredCategories.includes(category.name)){
              filteredCategories.push(category.name);
              //also push category to ko bound array if not a duplicate
              self.categoryList.push(category.name);
            } else {
                //capture index of duplicate category so we can delete it and capture associated restaurant index and move it into a single category
                let index = filteredCategories.findIndex(function(category){
                  return category === categories[filteredCategories.length].category;
                });
                categories[index].restaurants.push(categories[filteredCategories.length].restaurants[0]);
                categories.splice(filteredCategories.length,1);
              }
          });
      });
  });
  
  //subscribe to category list selection change
  this.selectedCategory.subscribe(function(category) {
    //empty the place list, so it can be rebuilt with places in the selected category
    self.placeList.removeAll();
    //filter markers with place filter
    clearMarkers(markers);
    //look for selected category in array of category objects, keyed to restaurant values
    let restaurants;
    categories.forEach(function(categoryObj){
      //if selected category matches category object, store the array of associated restaurants
      if (categoryObj.category === category[0]){
        restaurants = categoryObj.restaurants;
        //loop through each associated restaurant and match it to a restaurant in the placelist
        restaurants.forEach(function(restaurant){
              apiResponsePlacesArray.forEach(function(place){
                if(place.name === restaurant){
                  self.placeList.push(place);
                  markers.push(addPlaceMarker(place, map, true));
                }
              });
        });
      }
    });
    if (category[0] === 'All'){
      apiResponsePlacesArray.forEach(function(place){
            self.placeList.push(place);
            markers.push(addPlaceMarker(place, map, false));
      });
    }
    self.selected('clearSelection')
  });
  //sort by foursquare place rating(high to low) both ko bound places array and master places array from api calls
  this.sortListByRating = function(){
    let sortedList = sortList(self.placeList());
    self.placeList.removeAll();
    apiResponsePlacesArray = [];
    sortedList.forEach(function(place){
      self.placeList.push(place);
      apiResponsePlacesArray.push(place);
    });
  };
  //actions to perform with API data when restaurant is selected from list
  this.selected = function(selectedRestaurant) {
      apiResponsePlacesArray.forEach(function(place){
        if (place.name === selectedRestaurant.name){
          console.log(place);
          //Photo
          if (place.photos){
            let photoPrefix = place.photos.groups[1].items[0].prefix
            let photoSuffix = place.photos.groups[1].items[0].suffix
            let photoURL = photoPrefix + '200x200' + photoSuffix;
            console.log(photoURL);
            self.photoURL('<img src="' + photoURL + '">');
          }
          //Menu
          if (place.menu){
            self.menuURL("<a href=" + place.menu.url + ">Click to see menu on Foursquare</a>");
          } else self.menuURL("<p>menu not available</p>");
          //Price
          if(place.price){
            self.venuePrice('Price Guide: ' + place.price.message)
          }
        }
      });
      //Marker
      markers.find(function(marker){
        if(marker.title === selectedRestaurant.name){
          //single timed bounce of marker
          markerBounceToggle(marker);
          setTimeout(markerBounceToggle(marker),2000);
        }
      });
      if (selectedRestaurant === 'clearSelection'){
        self.photoURL('<div></div>');
        self.menuURL('<div></div>');
        self.venuePrice('<div></div>');
      }
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
  //initialise map
  mapInit();
  //remove splash screen
  setTimeout(function(){self.showSplash(false);},1500);
};

//google map API callback/loaded in html file
function init(){
  ko.applyBindings(new ViewModel());
}

//spoof api call with prepared json data
function fakeFoursquareRestaurantQuery(query){
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
function foursquareRestaurantQuery(query){
  return new Promise(function(resolve,reject){
    //initial, shallow foursquare place search to get venue id from supplied name and birmingham lat/lng area query
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

function addPlaceMarker(venue, map, category){
  let lat = venue.location.lat;
  let lng = venue.location.lng;
  let location = {lat,lng};
  let icon = 'img/bfit_map_pin.png';
  if(category){
    if (venue.categories[0].icon){
      let iconPrefix = venue.categories[0].icon.prefix;
      let iconSuffix = venue.categories[0].icon.suffix;
      icon = iconPrefix + '64' + iconSuffix; //use bg_ for grey background eg 'bg_32'
    }
  }
  let marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: venue.name,
      animation: google.maps.Animation.DROP,
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

function clearMarkers(markers){
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

//expects an array of arrays for the list argument
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