function getMinEnclosingRectangle(points) {
  var xCoords = [];
  var yCoords = [];

  for (var i = 0; i < points.length; i++) {
    xCoords.push(points[i][0]);
    yCoords.push(points[i][1]);
  }

  var minX = Math.min.apply(Math, xCoords);
  var minY = Math.min.apply(Math, yCoords);
  var maxX = Math.max.apply(Math, xCoords);
  var maxY = Math.max.apply(Math, yCoords);

  return [[minX, minY], [maxX, maxY]];
}

var p = [[1, 19], [22, 31], [13, 32], [14, 3]];

var rectangle = getMinEnclosingRectangle(p);

console.log(rectangle);
