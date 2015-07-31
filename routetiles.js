var p = [{lat:52.37965, lon:4.88658}, {lat:52.37645, lon:4.89474}, {lat:52.37404, lon:4.90023}, {lat:52.36890, lon:4.90577}];
var path = "";

const IMG_SIDE_PX = 256;

function getMinEnclosingRectangle(points) {
  var lats = [];
  var longs = [];

  for (var i = 0; i < points.length; i++) {
    lats.push(points[i].lat);
    longs.push(points[i].lon);
  }

  var minLat = Math.min.apply(Math, lats);
  var minLon = Math.min.apply(Math, longs);
  var maxLat = Math.max.apply(Math, lats);
  var maxLon = Math.max.apply(Math, longs);

  return {
    min:{lat:minLat, lon:minLon},
    max:{lat:maxLat, lon:maxLon},
    width: Math.abs(maxLon - minLon),
    height: Math.abs(maxLat - minLat)
  };
}

// See http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
function long2tile(lon,zoom) { return (Math.floor((lon + 180)/360 * Math.pow(2, zoom))); }
function lat2tile(lat,zoom)  { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI/180) + 1 / Math.cos(lat * Math.PI/180))/Math.PI)/2 * Math.pow(2, zoom))); }

function tileSizeDeg(zoom) {
  if (zoom >= 0 && zoom <= 19) {
    return {lats: 360 / Math.pow(2, zoom), longs: 170.1022 / Math.pow(2, zoom)};
  } else {
    return null;
  }
}

function getBestZoomLevel(widthDeg, heightDeg) {
  // TODO
}


function downloadTile(zoom, tileX, tileY, path) {
  var http = require('http');
  var fs = require('fs');

  var fileName =  tileX + "_" + tileY + "_" + zoom + ".png";

  var file = fs.createWriteStream(path + fileName);
  var request = http.get("http://tile.openstreetmap.org/" + zoom + "/" + tileX + "/" + tileY + ".png", function(response) {
    response.pipe(file);
  });
}

var rectangle = getMinEnclosingRectangle(p);

console.log(rectangle);

// var zoom = getBestZoomLevel(rectangle);
var zoom = 15;

var minX = lat2tile(rectangle.max.lat, zoom);
var minY = long2tile(rectangle.min.lon, zoom);
var maxX = lat2tile(rectangle.min.lat, zoom);
var maxY = long2tile(rectangle.max.lon, zoom);

console.log("minX: " + minX);
console.log("minY: " + minY);
console.log("maxX: " + maxX);
console.log("maxY: " + maxY);

for (var x = minX; x <= maxX; x++) {
  for (var y = minY; y <= maxY; y++) {
    console.log("x: " + x + ", y: " + y);
    downloadTile(zoom, y, x, path);
  }
}

// TODO Merge tiles

//downloadTile(17, long2tile(13.37771496361961, 17), lat2tile(52.51628011262304, 17), "")
