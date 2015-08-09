// It requires graphicsmagick
// $ sudo npm install -g gm
// $ brew install graphicsmagick
var TILES_PER_SIDE = 3;
var TILE_SERVER = "http://tile.openstreetmap.org";

var graphicsmagick = require('gm'),
    needle = require('needle'),
    _ = require('lodash');


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
    };
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

function downloadTile(zoom, tileX, tileY, tileFileName, i, j) {
    return new Promise(function(resolve, reject) {
        var url = TILE_SERVER + "/" + zoom + "/" + tileX + "/" + tileY + ".png";
        console.log(url);
        needle.get(url, { output: tileFileName })
            .on("data", function(data){
                resolve([i, j, tileFileName]);
            })
            .on("error", reject);
    });
}

function absolutePath(name, path, prependDir) {
    return  prependDir ? __dirname + '/' + path + "/" + name : '/' + path + '/' + name;
}


var combineRouteTiles = function combineRouteTiles(){
    var points = [{lat:58.37965, lon:4.88658}, {lat:52.37645, lon:4.89474}, {lat:63.37404, lon:4.90023}, {lat:49.36890, lon:4.90577}];
    var tmpPath = "tmp";
    var mapName = "routeMap.png";
    var mapPath = "static/images";
    var rectangle = getMinEnclosingRectangle(points);
    var zoom = getBestZoomLevel(rectangle);
    var tileCoordinates = getTileCoordinates(rectangle, zoom);

    // http://stackoverflow.com/questions/17369842/tile-four-images-together-using-node-js-and-graphicsmagick
    var promises = [];

    for (var x = tileCoordinates.min.x, i = 0; x <= tileCoordinates.max.x; x++, i += 256) {
        for (var y = tileCoordinates.min.y, j = 0; y <= tileCoordinates.max.y; y++, j += 256) {
            var tileFileName =  absolutePath(x + "_" + y + "_" + zoom + ".png", tmpPath, false);
            //promises.push(downloadTile(zoom, x, y, tileFileName));
            //gm = gm.in('-page', '+' + i + '+' + j).in(tileFileName);
            var tileP = downloadTile(zoom, x, y, tileFileName, i, j)
                .then(_.spread(function(indexI, indexJ, tileFile){
                    var gmArg = ['-page', '+' + indexI + '+' + indexJ];
                    return [gmArg, tileFile];
                }));
            promises.push(tileP);
        }
    }

    return Promise.all(promises)
        .then(function(argList) {  
            //argList => [ ['-page', '+n+m'], tileFileName ]
            var compiledGm = _.reduce(argList, function(gmObj, args){
                gmObj = gmObj.in.apply(gmObj, args[0]).in(args[1]);
                return gmObj
            }, graphicsmagick());
            return compiledGm;
        })
        .then(function(gm){
            return new Promise(function(resolve, reject){
                var mergedTilesFile = absolutePath(mapName, mapPath, true);
                // Merges the images as a matrix
                gm.mosaic()
                    .write(mergedTilesFile, function (err) {
                        if (err) reject(err);
                        else {
                            resolve([mapPath + '/' + mapName, points]);
                        }
                    });
            });
        });
};

exports.downloadAndComposeTilesAlongRoute = combineRouteTiles;
