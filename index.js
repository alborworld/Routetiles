var restify = require('restify'),
    hb = require('handlebars'),
    routetiles = require('./routetiles'),
    fs = require('fs');

function loadTmpl(path){
    return hb.compile(fs.readFileSync(path).toString());
}

function writeResponse(res, compiledTmpl, json){
    var content_type = json? "application/json" : "text/html"; 
    res.writeHead(200, {
        'Content-Length': Buffer.byteLength(compiledTmpl),
        'Content-Type': content_type
    }); 
    res.write(compiledTmpl);
    res.end();
}      

var tmpls = {};
tmpls.routetiles = loadTmpl(__dirname + '/client/index.tpl');

var server = restify.createServer({
    name: "routetile-server"
});

server.use(restify.acceptParser(server.acceptable)); 
server.use(restify.queryParser());
server.use(restify.bodyParser({
    mapParams: false
}));
server.pre(restify.pre.sanitizePath());
server.get(/\/static\/?.*/, restify.serveStatic({
    directory: __dirname
}));
server.get('/routetiles', function(req, res, next){

    var routetilePromise = routetiles.downloadAndComposeTilesAlongRoute();
    routetilePromise.then(function(tilesAsPNG, points){
        var data = {
            client: "Pippo",
            routeImg: tilesAsPNG
        };
        tmpl = tmpls.routetiles;
        var renderedHtml = tmpl(data);
        writeResponse(res, renderedHtml);
        next();
    });

    routetilePromise.catch(function(err){
        console.log(err.stack);
        res.writeHead(501);
        res.write(err);
        res.end();
        next();
    });
});

server.listen(8181, function(){
    console.log("Bella pe' te, sto ascoltando alla grande");
});
