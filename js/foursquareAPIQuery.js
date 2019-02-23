//due to stringent daily rate limits, this project has a spoof api function to pull EXACTLY the same data from a JSON URI link -- to use the correct function remove the extra F from the function below and add it to the function declaration below it

//GENUINE API call to Foursquare's servers - query argument is restaurant name
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
            alert('FourSquare venue/details search failed with error: ' + error);
          });
        });
    })
    .catch(function(error) {
      alert('FourSquare venue search failed with error: ' + error);
    });
  });
}


//SPOOF API call with prepared JSON data from URI
function FfoursquareRestaurantQuery(query){
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