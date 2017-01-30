/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const datastore = require('@google-cloud/datastore');
const googleapis = require('googleapis');
const googleauth = require('google-auth-library');
const client_secret = require('./client_secret.json');
const config = require('./config.json');

const ds = datastore({
  projectId: config.GOOGLE_CLOUD_PROJECT
});

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleauth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  var key = ds.key(['UserToken', 'mine']);
  ds.get(key, function(err, entity) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      var token = entity.token;
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  var key = ds.key(['UserToken', 'mine']);
  var entity = {
    key: key,
    data: [
      {
        name: 'token',
        property: JSON.stringify(token),
        excludeFromIndexes: true
      }
    ]
  };
  return ds.save(entity);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {googleapis.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  var calendar = googleapis.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
}


function quickAddEvent(auth, req, res) {
  var text = req.params.text;
  var calendar = googleapis.calendar('v3');
  calendar.events.quickAdd({
    auth: auth,
    calendarId: 'primary',
    text: text
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      res.status(501);
    res.json({message: 'An error occurred'});
      return;
    }
    res.json({message: 'Created event: ' + response.htmlLink});
  });
}


exports.quickAddEventPage = function quickAddEventPage (req, res) {
  authorize(client_secret, function (auth) {quickAddEvent(auth, req, res);});
};


exports.listEventsPage = function listEventsPage (req, res) {
  authorize(client_secret, listEvents);
  res.json({message: 'Ack'});
};
