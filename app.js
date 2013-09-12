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

app.get('/login', function(req, res) {
    res.writeHead(303, { 'location': foursquare.getAuthClientRedirectUrl() });
    res.end();
});

app.get('/', function (req, res) {

    console.log('req.query.code', req.query.code);

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
});

app.listen(8000);
