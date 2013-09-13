#!/opt/nodejs/0.10/bin/node

var net = require('net'),
    argv = require('optimist').argv,
    Q = require('q'),
    co = require('cocaine'),
    Worker = new co.Worker(argv),
    server = new co.http.Server(),
    handle = Worker.getListenHandle('http');

var config = {
    'secrets' : {
        'clientId' : 'BC5WFLKKNYREHXENVUUARGLPVJ25GVUJMKQLA4VQELZE4OCP',
        'clientSecret' : 'PPVJG20CML2PB10MX3XJN4UTN0VKPKOTBYOSZ0UULVI4M0FB',
        'redirectUrl' : 'http://localhost:8000'
    }
};

var foursquare = require('node-foursquare')(config),
    express = require('express'),
    app = express();

co.getServices(['geobase', 'uatraits'], function(geobase, uatraits) {

    app.get('/', function (req, res) {

        Q.all([_detectAgent(req), _detectRegion(req)])
            .spread(function(agent, region) {
                agent && (agent = JSON.stringify(agent, null, 2));

                res.send('region', region);

                res.send('req.query.code', req.query.code);

                foursquare.getAccessToken({
                    code: req.query.code
                }, function (error, accessToken) {

                    if(error) {
                        res.send('An error was thrown: ' + error.message);
                    }
                    else {
                        console.log('accessToken', accessToken);

                        var venuesNames = [];

                        foursquare.Venues.explore(56.57, 24.06, { radius: 10000 }, accessToken, function(error, venues) {
                            var items = venues.groups[0].items;

                            items.forEach(function(item) {
                                venuesNames.push(item.venue.name);
                            });

                            res.send(venuesNames.join('<br>'));
                        });
                    }
                });

            })
            .fail(function(error){
                res.end(error.toString());
            });

    });
});

function _detectAgent(req){
    var F = Q.defer();

    var ua = req.headers['user-agent'];

    if(ua){
        return uatraits.detect(ua);
    } else {
        F.resolve();
    }

    return F.promise;
}

function _detectRegion(req){
    var F = Q.defer();

    var ip = req.headers['x-real-ip'];
    if (ip && net.isIPv4(ip)) {

        return geobase.region_id(ip)
            .then(function(region_id){
                return geobase.coordinates(region_id);
            })
            .then(function(names){
                names.unshift(ip);
                return names;
            });

    } else {

        F.resolve();

    }

    return F.promise;
}

app.get('/login', function(req, res) {
    res.writeHead(303, { 'location': foursquare.getAuthClientRedirectUrl() });
    res.end();
});

argv.uuid ? server.listen(handle) : app.listen(8000);
