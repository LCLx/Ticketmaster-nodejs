var express = require('express');
var router = express.Router();
var url = require('url');
var querystring = require('querystring');
var getGeoHash = require('ngeohash');
var https = require('https');
var SpotifyWebApi = require('spotify-web-api-node');

/* GET users listing. */
var tm_api_key = 'API_KEY';
var songkick_api_key = 'API_KEY';
var google_api_key = 'API_KEY';

var spotifyApi = new SpotifyWebApi({
    clientId: 'API_KEY',
    clientSecret: 'API_KEY'
});
router.get('/', function (req, res, next) {
    res.send('This is a response');
});


router.get('/SearchEventTM', function (req, res, next) {
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
                console.log(finalResult);
                var tempArray = JSON.parse(finalResult);
                tempArray.lat = lat;
                tempArray.lon = lon;
                finalResult = JSON.stringify(tempArray);
                res.send(finalResult);
            });
        });
    } else {
        var result = '';
        var resURL = 'https://maps.googleapis.com/maps/api/geocode/json?key='+google_api_key+'&address=' + inputArray['inputOther'];
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
                            console.log(finalResult);
                            tempArray.lat = lat;
                            tempArray.lon = lon;
                            finalResult = JSON.stringify(tempArray);
                            res.send(finalResult);
                        });
                    });
                } else {
                    res.send();
                }
            });
        });
    }
});

router.get('/autoComplete', function (req, res, next) {
    var canRun = true;
    if(!canRun)
    {
        return ;
    }
    this.canRun = false;
    setTimeout(function(){
        var inputArray = querystring.parse(url.parse(req.url).query);
        https.get('https://app.ticketmaster.com/discovery/v2/suggest?apikey=' + tm_api_key + '&keyword=' + inputArray['keyword'], function (response) {
            if (response.statusCode !== 200) {
                console.log(response.statusCode);
                response.resume();
                return;
            }
            var result = '';
            response.on('data', function (data) {
                result += data;
            });
            response.on('end', function () {
                res.send(result);
            })
        });
        canRun = true;
    }, 600);

});

router.get('/reqUpcoming', function (req, res, next) {
    var inputArray = querystring.parse(url.parse(req.url).query);
    https.get('https://api.songkick.com/api/3.0/search/venues.json?apikey=' + songkick_api_key + '&query=' + inputArray['venueName'], function (response) {
        if (response.statusCode !== 200) {
            console.log(response.statusCode);
            response.resume();
            return;
        }
        var result = '';
        response.on('data', function (data) {
            result += data;
        });
        response.on('end', function () {
            // res.send(result);
            var resIDArray = JSON.parse(result);
            var resID;
            if (resIDArray['resultsPage']['results']['venue'] && resIDArray['resultsPage']['results']['venue'][0] && resIDArray['resultsPage']['results']['venue'][0]['id']) {
                resID = resIDArray['resultsPage']['results']['venue'][0]['id'];
                console.log(resID);
                https.get('https://api.songkick.com/api/3.0/venues/' + resID + '/calendar.json?apikey=' + songkick_api_key, function (innerRes) {
                    if (response.statusCode !== 200) {
                        console.log(response.statusCode);
                        response.resume();
                        return;
                    }
                    var innerResult = '';
                    innerRes.on('data', function (data) {
                        innerResult += data;
                    });
                    innerRes.on('end', function () {
                        // console.log(JSON.parse(innerResult)['resultsPage']['results']['event'].slice(0,5));
                        if(JSON.parse(innerResult)['resultsPage']['results']['event']){
                            res.send(JSON.parse(innerResult)['resultsPage']['results']['event'].slice(0,5));//TODO: reduce to 5
                        }
                        else {
                            res.send([]);
                        }
                    })
                });
            }
            else{
                res.send([]);
            }
        })
    })
});

router.get('/reqGooglePics', function (req, res, next) {
    var ans = {};
    var taskStack = [];
    var inputArray = querystring.parse(url.parse(req.url).query);
    // console.log(inputArray['artists']);
    if(typeof(inputArray['artists'])==="object" ) {

        for (var i in inputArray['artists']) {
            if(i<2) {
                taskStack.push(
                    new Promise(function (resolve, reject) {
                        // console.log(i);
                        var resData = {
                            'q': inputArray['artists'][i],
                            'cx': '001619981126418577993:yagm2upnqrq',
                            'imgSize': 'huge',
                            'imgType': 'news',
                            'num': 8,
                            'searchType': 'image',
                            'key': google_api_key
                        };
                        console.log('https://www.googleapis.com/customsearch/v1?' + querystring.encode(resData));
                        https.get('https://www.googleapis.com/customsearch/v1?' + querystring.encode(resData), function (response) {
                            if (response.statusCode !== 200) {
                                // console.log(response.statusCode);
                                response.resume();
                                return;
                            }
                            var result = '';
                            response.on('data', function (data) {
                                result += data;
                            });
                            response.on('end', function () {
                                // console.log(result);
                                var googleRes = JSON.parse(result);
                                // console.log(googleRes);
                                var picArray = [];
                                for (var j in googleRes['items']) {
                                    // console.log(googleRes['items'][j]['link']);
                                    picArray.push(googleRes['items'][j]['link']);
                                }
                                // console.log(picArray);
                                ans[googleRes['queries']['request'][0]['searchTerms']] = picArray;
                                resolve();
                            })

                        })
                    })
                );
            }
        }
    }
    else
    {
        taskStack.push(
            new Promise(function (resolve, reject) {
                // console.log(i);
                var resData = {
                    'q': inputArray['artists'],
                    'cx': '001619981126418577993:yagm2upnqrq',
                    'imgSize': 'huge',
                    'imgType': 'news',
                    'num': 8,
                    'searchType': 'image',
                    'key': google_api_key
                };
                console.log('https://www.googleapis.com/customsearch/v1?' + querystring.encode(resData));
                https.get('https://www.googleapis.com/customsearch/v1?' + querystring.encode(resData), function (response) {
                    if (response.statusCode !== 200) {
                        // console.log(response.statusCode);
                        response.resume();
                        return;
                    }
                    var result = '';
                    response.on('data', function (data) {
                        result += data;
                    });
                    response.on('end', function () {
                        // console.log(result);
                        var googleRes = JSON.parse(result);
                        // console.log(googleRes);
                        var picArray = [];
                        for (var j in googleRes['items']) {
                            // console.log(googleRes['items'][j]['link']);
                            picArray.push(googleRes['items'][j]['link']);
                        }
                        // console.log(picArray);
                        ans[googleRes['queries']['request'][0]['searchTerms']] = picArray;
                        resolve();
                    })

                })
            })
        );
    }
    Promise.all(taskStack).then(function () {
        // console.log(ans);
        res.send(ans);
    });
});
router.get('/reqSpotify', function (req, res, next) {
    var ans = {};
    var taskStack = [];
    var inputArray = querystring.parse(url.parse(req.url).query);
    // console.log(inputArray['artists']);
    spotifyApi.clientCredentialsGrant().then(
        function (data) {
            console.log('The access token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);
            if (typeof (inputArray['artists']) === "object") {
                for (var x in inputArray['artists']) {
                    // console.log(1);
                    taskStack.push(
                        new Promise(function (resolve, reject) {
                            var name = inputArray['artists'][x];
                            spotifyApi.searchArtists(name).then(
                                function (spotRes) {
                                    // console.log(2);
                                    spotRes = spotRes['body'];
                                    // console.log(spotRes);
                                    if (spotRes['artists'] && spotRes['artists']['items']) {
                                        for (var y in spotRes['artists']['items']) {
                                            if (name === spotRes['artists']['items'][y]['name']) {
                                                ans[name] = {
                                                    'followers': spotRes['artists']['items'][y]['followers']['total'],
                                                    'popularity': spotRes['artists']['items'][y]['popularity'],
                                                    'checkAt': spotRes['artists']['items'][y]['external_urls']['spotify']
                                                };
                                                break;
                                                // console.log(ans);
                                            }
                                        }
                                    }
                                    resolve();
                                }
                                ,
                                function (err) {
                                    console.log('Something went wrong when retrieving an access token', err);
                                }
                            )
                        })
                    )
                }

            }
            else{
                taskStack.push(
                    new Promise(function (resolve, reject) {
                        var name = inputArray['artists'];
                        spotifyApi.searchArtists(name).then(
                            function (spotRes) {
                                // console.log(2);
                                spotRes = spotRes['body'];
                                // console.log(spotRes);
                                if (spotRes['artists'] && spotRes['artists']['items']) {
                                    for (var y in spotRes['artists']['items']) {
                                        if (name === spotRes['artists']['items'][y]['name']) {
                                            ans[name] = {
                                                'followers': spotRes['artists']['items'][y]['followers']['total'],
                                                'popularity': spotRes['artists']['items'][y]['popularity'],
                                                'checkAt': spotRes['artists']['items'][y]['external_urls']['spotify']
                                            }
                                            break;
                                            // console.log(ans);
                                        }
                                    }
                                }
                                resolve();
                            }
                            ,
                            function (err) {
                                console.log('Something went wrong when retrieving an access token', err);
                            }
                        )
                    })
                )
            }
            Promise.all(taskStack).then(function () {
                // console.log(ans);
                res.send(ans);
            });
        },
        function (err) {
            console.log('Something went wrong when retrieving an access token', err);
        }
    );
    spotifyApi.searchArtists('lady gaga').then(function (data) {
            for (var x in inputArray['artist']) {
                spotifyApi.searchArtists(inputArray['artist'][x]).then()
            }
        }, function (err) {
            console.log(err);
            if (err.statusCode === 401) {

            }
        }
    )
});

module.exports = router;
