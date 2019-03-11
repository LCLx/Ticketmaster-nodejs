var express = require('express');
var router = express.Router();
var url = require('url');
var querystring = require('querystring');
var getGeoHash = require('ngeohash');
var http = require('http');
var https = require('https');
var method = require('./Method');
/* GET users listing. */
var tm_api_key = 'API_KEY';

router.get('/', function (req, res, next) {
    res.send('This is a response');
});


router.get('/SearchEventTM', function(req, res, next){
    var inputArray = querystring.parse(url.parse(req.url).query);
    // var x = method.getTM(inputArray);
    // res.send(x);
    if (inputArray === undefined)
        return;
    var dis = 10;
    var geoHash;
    var lat, lon;
    if (inputArray['inputDistance'] !== '') {
        dis = inputArray['inputDistance'];
    }

    var category = {
        'music': 'KZFzniwnSyZfZ7v7nJ',
        'sports': 'KZFzniwnSyZfZ7v7nE',
        'art_theatre': 'KZFzniwnSyZfZ7v7na',
        'film': 'KZFzniwnSyZfZ7v7nn',
        'miscellaneous': 'KZFzniwnSyZfZ7v7n1',
        'all': ''
    };

    // xhr.open('GET',resPath,false);
    var finalResult = '';
    if (inputArray['inputFrom'] === 'current') {
        lat = inputArray['lat'];
        lon = inputArray['lon'];
        geoHash = getGeoHash.encode(lat, lon, 5);
        var reqData = {
            'apikey': tm_api_key,
            'keyword': inputArray['inputKeyword'],
            'radius': dis,
            'unit': inputArray['distanceMeasure'],
            'geoPoint': geoHash,
            'segmentId': category[inputArray['inputCategory']]
        };
        // var xhr = new XMLHttpRequest();
        var resPath = 'https://app.ticketmaster.com/discovery/v2/events.json?' + querystring.encode(reqData);
        https.get(resPath, function (response) {
            // console.log('statusCode:', response.statusCode)
            if (response.statusCode !== 200) {
                console.log(response.statusCode);
                response.resume();
                return;
            }
            response.on('data', function (data) {
                finalResult += data;
            });
            response.on('end', function () {
                var tempArray = JSON.parse(finalResult);
                tempArray.lat = lat;
                tempArray.lon = lon;
                finalResult = JSON.stringify(tempArray);
                res.send (finalResult);
            });
        });
    } else {
        var result = '';
        var resURL = 'https://maps.googleapis.com/maps/api/geocode/json?key=API_KEYw&address=' + inputArray['inputOther'];
        https.get(resURL, function (response) {
            response.on('data', function (data) {
                result += data;
            });
            response.on('end', function () {
                var geo = JSON.parse(result);
                if (geo['results'].length > 0) {
                    lat = geo['results'][0]['geometry']['location']['lat'].toString();//Convert Google API Data to string.
                    lon = geo['results'][0]['geometry']['location']['lng'].toString();
                    geoHash = getGeoHash.encode(lat, lon, 5);
                    var reqData = {
                        'apikey': tm_api_key,
                        'keyword': inputArray['inputKeyword'],
                        'radius': dis,
                        'unit': inputArray['distanceMeasure'],
                        'geoPoint': geoHash,
                        'segmentId': category[inputArray['inputCategory']]
                    };
                    // var xhr = new XMLHttpRequest();
                    var resPath = 'https://app.ticketmaster.com/discovery/v2/events.json?' + querystring.encode(reqData);
                    https.get(resPath, function (response) {
                        // console.log('statusCode:', response.statusCode)
                        if (response.statusCode !== 200) {
                            response.resume();
                            return;
                        }
                        response.on('data', function (data) {
                            finalResult += data;
                        });
                        response.on('end', function () {
                            var tempArray = JSON.parse(finalResult);
                            tempArray.lat = lat;
                            tempArray.lon = lon;
                            finalResult = JSON.stringify(tempArray);
                            res.send( finalResult);
                        });
                    });
                } else {
                    res.send();
                }
            });
        });
    }
});

router.get('/autoComplete',function (req, res, next) {
    var inputArray = querystring.parse(url.parse(req.url).query);
    https.get('https://app.ticketmaster.com/discovery/v2/suggest?apikey='+tm_api_key+'&keyword='+inputArray['keyword'],function (response) {
        if (response.statusCode !== 200) {
            console.log(response.statusCode);
            response.resume();
            return;
        }
        var result = '';
        response.on('data',function (data) {
            result+=data;
        });
        response.on('end',function(){
            res.send(result);
        })
    });
});
module.exports = router;
