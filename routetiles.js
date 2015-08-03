var http = require('http');
var fs = require('fs');

var p = [{lat:58.37965, lon:4.88658}, {lat:52.37645, lon:4.89474}, {lat:63.37404, lon:4.90023}, {lat:49.36890, lon:4.90577}];
var path = "";

var MAX_LATS = 360;
var MAX_LONGS = 170.1022;
var MAX_TILES_PER_SIDE = 3;

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
function lon2tileX(lon,zoom) { return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom))); }
function lat2tileY(lat,zoom) { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))); }

function getTileSize(zoom) {
  if (zoom >= 0 && zoom <= 19) {
    return {height: MAX_LATS / Math.pow(2, zoom), width: MAX_LONGS / Math.pow(2, zoom)};
  } else {
    return null;
  }
}

function getBestZoomLevel(rectangle) {
  var bestZoom = 0;

  for (var zoom = 0; zoom <= 19; zoom++) {
    var tileSize = getTileSize(zoom);
    if (tileSize != null) {
      var maxHeight = (tileSize.height * MAX_TILES_PER_SIDE < MAX_LATS) ? (tileSize.height * MAX_TILES_PER_SIDE) : MAX_LATS;
      var maxWidth = (tileSize.width * MAX_TILES_PER_SIDE < MAX_LONGS) ? (tileSize.width * MAX_TILES_PER_SIDE) : MAX_LONGS;

      if (rectangle.height <= maxHeight && rectangle.width <= maxWidth) {
        bestZoom = zoom;
        // console.log("zoom: " + zoom + ", tileSize: (" + maxHeight + ", " + maxWidth + "), rectangle size: (" + rectangle.height + ", " + rectangle.width + ")");
      }
    }
  }

  return bestZoom;
}

function downloadTile(zoom, tileX, tileY, path) {
  var fileName =  tileX + "_" + tileY + "_" + zoom + ".png";

  var file = fs.createWriteStream(path + fileName);
  var request = http.get("http://tile.openstreetmap.org/" + zoom + "/" + tileX + "/" + tileY + ".png", function(response) {
    response.pipe(file);
  });
}

var rectangle = getMinEnclosingRectangle(p);

console.log(rectangle);

var zoom = getBestZoomLevel(rectangle);

console.log("Zoom level: " + zoom);

var minXtile = lon2tileX(rectangle.min.lon, zoom);
var minYtile = lat2tileY(rectangle.min.lat, zoom);
var maxXtile = lon2tileX(rectangle.max.lon, zoom);
var maxYtile = lat2tileY(rectangle.max.lat, zoom);

console.log("minXtile: " + minXtile);
console.log("minYtile: " + minYtile);
console.log("maxXtile: " + maxXtile);
console.log("maxYtile: " + maxYtile);

for (var x = minXtile; x <= maxXtile; x++) {
  for (var y = minYtile; y <= maxYtile; y++) {
    console.log("x: " + x + ", y: " + y);
    downloadTile(zoom, x, y, path);
  }
}

// TODO Merge tiles

//downloadTile(17, long2tile(13.37771496361961, 17), lat2tile(52.51628011262304, 17), "")
