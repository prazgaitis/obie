const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

// This code is adapted from the Google Sheets Quickstart guide found here:
// https://developers.google.com/sheets/api/quickstart/nodejs

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials, instance) {
  return new Promise((resolve) => {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        return getNewToken(oAuth2Client, instance);
      }
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client);
    });
  });
}

function getNewToken(oAuth2Client, instance) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);

        instance.auth = oAuth2Client;
      });
    });
  });
}

class SheetsHandler {
  init = async () => {
    // authenticate
    const credentials = fs.readFileSync("credentials.json");
    const auth = await authorize(JSON.parse(credentials), this);
    this.auth = auth;

    // Create in-memory data structure to hold carrier data
  };

  importData = () => {
    const ranges = ["PL - IL/IN/MI!A:D"];

    const coverages = [];

    for (let range of ranges) {
    }
  };

  carriers = async () => {
    return new Promise((resolve) => {
      const sheets = google.sheets({ version: "v4", auth: this.auth });
      sheets.spreadsheets.values.get(
        {
          spreadsheetId: "1XGBd2qUVjz7OwmbYDQNbrmyf4NuLYaVWwswS4zx6_iw",
          range: "PL - IL/IN/MI!A:D",
        },
        (err, res) => {
          if (err) return console.log("The API returned an error: " + err);
          const rows = res.data.values;
          if (rows.length) {
            resolve(rows);
          } else {
            console.log("No data found.");
          }
        }
      );
    });
  };
}

module.exports = SheetsHandler;
