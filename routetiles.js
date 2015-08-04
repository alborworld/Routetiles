// It requires graphicsmagick
// $ sudo npm install -g gm
// $ brew install graphicsmagick

var graphicsmagick = require('gm');
var needle = require('needle');

var points = [{lat:58.37965, lon:4.88658}, {lat:52.37645, lon:4.89474}, {lat:63.37404, lon:4.90023}, {lat:49.36890, lon:4.90577}];
var tmpPath = "/tmp";
var mapName = "routeMap.png";
var mapPath = "";

var TILES_PER_SIDE = 3;
var TILE_SERVER = "http://tile.openstreetmap.org/";

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
  var minYtile = lat2tileY(rectangle.max.lat, zoom); // latitude and Y are opposite in direction
  var maxXtile = lon2tileX(rectangle.max.lon, zoom);
  var maxYtile = lat2tileY(rectangle.min.lat, zoom);
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

function getBestZoomLevel(rectangle) {
  var bestZoom = 0;

  for (var zoom = 0; zoom <= 19; zoom++) {
    var tileCoordinates = getTileCoordinates(rectangle, zoom);
    if (tileCoordinates.xTilesNum <= TILES_PER_SIDE && tileCoordinates.yTilesNum <= TILES_PER_SIDE) {
      bestZoom = zoom;
    }
  }

  return bestZoom;
}

function downloadTile(zoom, tileX, tileY, path) {
  var tileName =  tileX + "_" + tileY + "_" + zoom + ".png";
  var url = TILE_SERVER + zoom + "/" + tileX + "/" + tileY + ".png";

  needle.get(url, { output: absolutePath(tileName, path) }, function(err, resp, body) {
    if (err || resp.statusCode != 200) {
      console.log("Error downloading tile (" + tileName + "): " + err)
    }
  });

  return tileName;
}

function absolutePath(name, path) {
  return (path.length > 0) ? path + "/" + name : name;
}

var rectangle = getMinEnclosingRectangle(points);

console.log(rectangle);

var zoom = getBestZoomLevel(rectangle);

console.log("Zoom level: " + zoom);

var tileCoordinates = getTileCoordinates(rectangle, zoom);

console.log("minXtile: " + tileCoordinates.min.x);
console.log("minYtile: " + tileCoordinates.min.y);
console.log("maxXtile: " + tileCoordinates.max.x);
console.log("maxYtile: " + tileCoordinates.max.y);

// http://stackoverflow.com/questions/17369842/tile-four-images-together-using-node-js-and-graphicsmagick
var gm = graphicsmagick();

for (var x = tileCoordinates.min.x, i = 0; x <= tileCoordinates.max.x; x++, i += 256) {
  for (var y = tileCoordinates.min.y, j = 0; y <= tileCoordinates.max.y; y++, j += 256) {
    console.log("x: " + x + ", y: " + y);
    tileName = downloadTile(zoom, x, y, tmpPath);
    gm = gm.in('-page', '+' + i + '+' + j).in(absolutePath(tileName, tmpPath));
  }
}

gm.mosaic()  // Merges the images as a matrix
    .write(absolutePath(mapName, mapPath), function (err) {
        if (err) console.log(err);
    });
