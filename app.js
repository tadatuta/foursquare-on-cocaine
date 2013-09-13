#!/opt/nodejs/0.10/bin/node

var config = {
    'secrets' : {
        'clientId' : 'BC5WFLKKNYREHXENVUUARGLPVJ25GVUJMKQLA4VQELZE4OCP',
        'clientSecret' : 'PPVJG20CML2PB10MX3XJN4UTN0VKPKOTBYOSZ0UULVI4M0FB',
        'redirectUrl' : 'http://cocacloud.dev.yandex.net/foursquare/http/'
    }
};

var foursquare = require('node-foursquare')(config),
    express = require('express'),
    app = express(),
    argv = require('optimist').argv,
    Q = require('q');

argv.uuid && app.set('env', 'cocaine');

// all environments
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.bodyParser());
//app.use(express.methodOverride());
app.use(express.static(__dirname + '/desktop.bundles/index'));
//app.use(express.errorHandler());

// cocaine only
if (app.get('env') == 'cocaine') {

    var cocaine = require('cocaine'),
        http = cocaine.http,
        Worker = new cocaine.Worker(argv),
        handle = Worker.getListenHandle('http');

    app.set('handle', handle);

    var server = new http.Server(app);

} else {

    var http = require('http');

    app.set('handle', process.env.PORT || 3000);

    var server = http.createServer(app);

}

var BEMHTML = require('./desktop.bundles/index/_index.bemhtml.js').BEMHTML,
    BEMTREE = require('./desktop.bundles/index/index.bemtree.js').BEMTREE;

app.get('/', function(req, res) {

    foursquare.getAccessToken({
        code: req.query.code
    }, function (error, accessToken) {

        if(error) {
            res.send('An error was thrown: ' + error.message);
        }
        else {
            // console.log('accessToken', accessToken);

            var venuesNames = [];

            foursquare.Venues.explore(56.57, 24.06, { radius: 10000 }, accessToken, function(error, venues) {
                var items = venues.groups[0].items;

                items.forEach(function(item) {
                    venuesNames.push(item.venue.name);
                });

                BEMTREE.apply()
                    .then(function(bemjson) {
                         // res.send(BEMHTML.apply(bemjson));
                         res.send(venuesNames.join('<br>'));
                    });
            });
        }
    });
});

app.get('/login', function(req, res) {
    res.writeHead(303, { 'location': foursquare.getAuthClientRedirectUrl() });
    res.end();
});

app.get('/bla', function(req, res) {
   res.send('bla');
});

server.listen(app.get('handle'), function() {
    console.log('Express server listening on ' +
        (typeof app.get('handle') === 'number' ?
            'port ' + app.get('handle') :
            'cocane handle'));
});
