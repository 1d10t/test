function geo_watch(success, error) {
  
  if(!error)
    error = function(err) { console.warn(`ERROR(${err.code}): ${err.message}`); };
  
  if (!("geolocation" in navigator)){
    error({code: 0, message: 'Geolocation is not supported by your browser'});
    return;
  }
  
  return navigator.geolocation.watchPosition(success, error, {enableHighAccuracy: true, maximumAge: 0, timeout: 27000});
}

var geo_watch_id = geo_watch(function(position){
  var crd = position.coords;
  console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);
});

//navigator.geolocation.clearWatch(geo_watch_id);