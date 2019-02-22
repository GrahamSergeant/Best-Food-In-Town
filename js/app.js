//get Foursquare API keys from config.js file
const CLIENT_ID = config.CLIENT_ID;
const CLIENT_SECRET = config.CLIENT_SECRET;
//ko bound viewmodel - called in init() function
let ViewModel = function() {
  let self = this;
  //declare restaurant array, ko bound to restaurant list element in html
  this.placeList = ko.observableArray ([]);
  //declare restaurant array, ko bound to restaurant list element in html
  this.categoryList = ko.observableArray (['All']);
  //update data elements for selected venue
  this.selectedCategory = ko.observable();
  this.selectedRestaurant = ko.observable();
  this.menuURL = ko.observable();
  this.websiteURL = ko.observable();
  this.venuePrice = ko.observable();
  this.photoURL = ko.observable('<img src="img/bfit_splash.png">');
  this.imageAttribution = ko.observable();
  //data collection - pushed out to various api and function calls and updated on return
  let map;
  let markers = [];
  let categories = [];
  let filteredCategories = [];
  //keep a master reference to the placelist so when we take out of the places array, we can put back when category is selected
  let apiResponsePlacesArray = [];
  //pull initial restaurant data from prepared object in place_data.js
  places().forEach(function(restaurant){
      //call foursquare api with restaurant name
      foursquareRestaurantQuery(restaurant.name).then(function(response){
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
    self.selected('clearSelection');
  });
  //sort ko bound places array by foursquare place rating(high to low)
  this.sortListByRating = function(){
    let sortedList = sortList(self.placeList());
    self.placeList.removeAll();
    sortedList.forEach(function(place){
      self.placeList.push(place);
    });
  };
  //actions to perform with API data when restaurant is selected from list
  this.selected = function(selectedRestaurant) {
      self.selectedRestaurant('<p>' + selectedRestaurant.name + ' Rating: '+selectedRestaurant.rating + '</p>');
      apiResponsePlacesArray.forEach(function(place){
        if (place.name === selectedRestaurant.name){
          //centre map on selected
          map.panTo({lat:place.location.lat,lng:place.location.lng,});
          map.panBy(-50,-150);//pan slightly south-east to give room for infowindow/sidebar
          //Menu
          if (place.menu){
            self.menuURL('<a href=' + place.menu.url + '>Menu</a>');
          } else {self.menuURL('');}
          //website
          if (place.url){
            self.websiteURL('<a href=' + place.url + '>' + place.url + '</a>');
          } else {self.websiteURL('');console.log(place.url);}
          //Price
          if(place.price){
            self.venuePrice('Price Guide: ' + place.price.message);
          }else {self.venuePrice('');}
          //Photo
          if (place.photos){
            let photoPrefix = place.photos.groups[1].items[0].prefix;
            let photoSuffix = place.photos.groups[1].items[0].suffix;
            let photoURL = photoPrefix + '200x200' + photoSuffix;
            self.photoURL('<img src="' + photoURL + '">');
            //image attribution
            self.imageAttribution('Photo Credit: ' + place.photos.groups[1].items[0].user.firstName + ' ' + place.photos.groups[1].items[0].user.lastName +", " +  new Date(place.photos.groups[1].items[0].createdAt * 1000).getFullYear());
          }
        }
      });
      //Marker
      markers.find(function(marker){
        if(marker.title === selectedRestaurant.name){
          //bounce on - bounce off
          markerBounceToggle(marker);
          setTimeout(function(){
            markerBounceToggle(marker);
          },2000);
        }
      });
      //clean elements on no selection event
      if (selectedRestaurant === 'clearSelection'){
        self.photoURL('<img src="img/bfit_splash.png">');
        self.menuURL('');
        self.venuePrice('');
        self.websiteURL('');
        self.selectedRestaurant('');
      }
  };
  //initial map set up - called once
  function mapInit(){
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: {lat: 52.4813098, lng: -1.9156044},
      mapTypeControl: false,
      styles: mapStyle()
    });
  }
  //initialise map
  mapInit();
};

//google map API callback/loaded in html file
function init(){
  ko.applyBindings(new ViewModel());
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

//marker and infowindow manipulation functions below
function addPlaceMarker(venue, map, category){
  let lat = venue.location.lat;
  let lng = venue.location.lng;
  let location = {lat,lng};
  let icon = 'img/bfit_map_pin.png';
  if(category){
    if (venue.categories[0].icon){
      map.panTo(location);
      map.panBy(-50,-150);//pan slightly south-east to give room for infowindow/sidebar
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
  let placeInfoWindow = new google.maps.InfoWindow({maxWidth: 230});
  maxWidth: 200
  marker.addListener('click', function() {
    if (placeInfoWindow.marker != this) {
          markerBounceToggle(this);
          setTimeout(function(){
            markerBounceToggle(marker)
          },2000);
          map.panTo(marker.position);
          map.panBy(-50,-150); //pan slightly south-east to give room for infowindow/sidebar
          openInfoWindow(this, placeInfoWindow, venue, map);
    }
  });
  return (marker);
}

function openInfoWindow(marker, infowindow, venue, map) {
    //infowindow html string construction from api data
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
      innerHTML += '<br>' + '<strong>' + venue.tips.groups[0].items[0].user.firstName + ' ' + venue.tips.groups[0].items[0].user.lastName + '\'s tip: ' + '</strong>' + '\"' + venue.tips.groups[0].items[0].text + ' \"';
    }
    if (venue.tips.groups[0].items[0].photo) {
      let photoPrefix = venue.tips.groups[0].items[0].photo.prefix
      let photoSuffix = venue.tips.groups[0].items[0].photo.suffix
      let photoURL = photoPrefix + '300x300' + photoSuffix;
      //tooltip image attribution with year
        innerHTML += '<br><br><img src="' + photoURL + '" title="' + 'Photo Credit: ' + venue.tips.groups[0].items[0].user.firstName + ' ' + venue.tips.groups[0].items[0].user.lastName + ', ' + new Date(venue.tips.groups[0].items[0].photo.createdAt * 1000).getFullYear() + '">';
      }
    innerHTML += '</div>' + '</div>';
    //infowindow options
    infowindow.setContent(innerHTML);
    infowindow.setZIndex(5);
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