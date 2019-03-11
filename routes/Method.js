var getGeoHash = require('ngeohash');
var querystring = require('querystring');
var url = require('url');
var http = require('http');
var https = require('https');
exports.getTM = function getTM(inputArray) {
    if (inputArray === undefined)
        return;
    var tm_api_key = 'API_KEY';
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
            response.on('data', function (data) {
                finalResult += data;
            });
            response.on('end', function () {
                var tempArray = JSON.parse(finalResult);
                tempArray.lat = lat;
                tempArray.lon = lon;
                finalResult = JSON.stringify(tempArray);
                return finalResult;
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
                    lat = geo['results'][0]['geometry']['location']['lat'];
                    lon = geo['results'][0]['geometry']['location']['lng'];
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
                        response.on('data', function (data) {
                            finalResult += data;
                        });
                        response.on('end', function () {
                            var tempArray = JSON.parse(finalResult);
                            tempArray.lat = lat;
                            tempArray.lon = lon;
                            finalResult = JSON.stringify(tempArray);
                            return finalResult;
                        });
                    });
                } else {
                    return '';
                }
            });
        });
    }
};