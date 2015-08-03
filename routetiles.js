var http = require('http');
var fs = require('fs');

var p = [{lat:58.37965, lon:4.88658}, {lat:52.37645, lon:4.89474}, {lat:63.37404, lon:4.90023}, {lat:49.36890, lon:4.90577}];
var path = "";

var MAX_TILES_PER_SIDE = 3;

function getMinEnclosingRectangle(points) {
  var lats = [];
  var lons = [];

  for (var i = 0; i < points.length; i++) {
    lats.push(points[i].lat);
    lons.push(points[i].lon);
  }

  var minLat = Math.min.apply(Math, lats);
  var minLon = Math.min.apply(Math, lons);
  var maxLat = Math.max.apply(Math, lats);
  var maxLon = Math.max.apply(Math, lons);

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

function absDiff(one, two) {
  return Math.abs(one - two) + 1;
}

function getTileCoordinates(rectangle, zoom) {
  var minXtile = lon2tileX(rectangle.min.lon, zoom);
  var minYtile = lat2tileY(rectangle.min.lat, zoom);
  var maxXtile = lon2tileX(rectangle.max.lon, zoom);
  var maxYtile = lat2tileY(rectangle.max.lat, zoom);
  var xTilesNum = absDiff(maxXtile, minXtile);
  var yTilesNum = absDiff(maxYtile, minYtile);

  // Adjust the number of tiles to 3 in x and y direction, if too small
  // TODO consider edge cases
  if (xTilesNum == 1) {
    maxXtile += 1;
    minXtile -= 1;
  }
  if (yTilesNum == 1) {
    maxYtile += 1;
    minYtile -= 1;
  }
  if (xTilesNum == 2) {
    maxXtile += 1;
  }
  if (yTilesNum == 2) {
    maxYtile += 1;
  }

  return {
    min:{x:minXtile, y:minYtile},
    max:{x:maxXtile, y:maxYtile},
    xTilesNum: absDiff(maxXtile, minXtile),
    yTilesNum: absDiff(maxYtile, minYtile)
  }
}

// IMPROVE
function getBestZoomLevel(rectangle) {
  var bestZoom = 0;

  for (var zoom = 0; zoom <= 19; zoom++) {
    var tileCoordinates = getTileCoordinates(rectangle, zoom);
    if (tileCoordinates.xTilesNum <= MAX_TILES_PER_SIDE && tileCoordinates.yTilesNum <= MAX_TILES_PER_SIDE) {
      bestZoom = zoom;
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

var tileCoordinates = getTileCoordinates(rectangle, zoom);

console.log("minXtile: " + tileCoordinates.min.x);
console.log("minYtile: " + tileCoordinates.min.y);
console.log("maxXtile: " + tileCoordinates.max.x);
console.log("maxYtile: " + tileCoordinates.max.y);

for (var x = tileCoordinates.min.x; x <= tileCoordinates.max.x; x++) {
  // TODO FIX max min
  for (var y = tileCoordinates.max.y; y <= tileCoordinates.min.y; y++) {
    console.log("x: " + x + ", y: " + y);
    downloadTile(zoom, x, y, path);
  }
}

// TODO Merge tiles

//downloadTile(17, long2tile(13.37771496361961, 17), lat2tile(52.51628011262304, 17), "")
