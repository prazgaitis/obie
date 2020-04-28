const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { parse } = require("./SheetParser");
const { spreadsheetId, scopes, tabs } = require("./config.json");

// This code is adapted from the Google Sheets Quickstart guide
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
    scope: scopes,
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

const extractSheetName = (str) => {
  return str.split("!")[0].replace(/'/g, "");
};

// class to handle interactions with the Google Sheet
class SheetsHandler {
  init = async () => {
    // authenticate
    console.log("Loading...");
    const credentials = fs.readFileSync("credentials.json");
    const auth = await authorize(JSON.parse(credentials), this);
    this.auth = auth;
  };

  importData = async () => {
    let carrierPreferences = [];

    const rawData = await this.batchGetCarrierPreferences();
    for (let key in rawData) {
      const name = extractSheetName(key);
      const tab = tabs.filter((t) => t.sheet_name === name)[0];

      if (tab && tab.hasOwnProperty("states")) {
        carrierPreferences.push(parse(rawData[key], { states: tab.states }));
      }

      if (tab && tab.hasOwnProperty("type")) {
        carrierPreferences.push(parse(rawData[key], { type: tab.type }));
      }
    }

    carrierPreferences = carrierPreferences.flat();
    console.log(
      `Done importing data! Got ${carrierPreferences.length} records.`
    );

    return carrierPreferences;
  };

  batchGetCarrierPreferences = async () => {
    return new Promise((resolve, reject) => {
      const sheets = google.sheets({ version: "v4", auth: this.auth });
      // add cell range to sheet name if one is given
      const ranges = tabs.map((t) => {
        return Boolean(t.range) ? t.sheet_name + "!" + t.range : t.sheet_name;
      });

      // get data from Carrier Preferences Sheet
      sheets.spreadsheets.values.batchGet(
        { ranges, spreadsheetId },
        (err, res) => {
          if (err) {
            console.log(
              "Token is probably expired. Run `rm token.json` and restart the app!\n"
            );
            reject(`Google Sheets API returned an error: ${err}`);
          }

          const results = {};

          try {
            const ranges = res.data.valueRanges;

            for (let range of ranges) {
              const name = range.range;
              const { values } = range;
              results[name] = values;
            }

            resolve(results);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };
}

module.exports = SheetsHandler;
