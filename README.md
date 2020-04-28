### Carrier Preferences API

#### Overview

- The service receives a request with a US state and desired type of coverage.
- The services returns a JSON response containing a list of all carriers that offer the specified type of coverage in the desired US state.

#### Examples

A request might look like this:

```
POST /search
state=FL&coverage=AUTO
```

Which returns a response like this:

```json
{
  "carriers": [
    {
      "carrier": "Allstate",
      "state": "FL",
      "coverage": "AUTO"
    }
  ]
}
```

## Loading data

In order for the API to work, we need to load the data from the provided Google Sheet. A naive solution might involve manually entering the data from the Google Sheet into one canonical source-of-truth CSV or JSON file. Our web service can read this file into memory, parse it, and use it to return the correct response. The problem with this approach is that you now have two sources of data - the source-of-truth file and the Google Sheet. Both the source-of-truth file and the Google Sheet need to be updated when something changes. The data can get out of sync, or we could make a mistake when copying data.

In an ideal world, we have all of the necessary data in a database. Our web service uses this database to return the correct response. Users can also update the data if we add a new carrier or a carrier's coverage changes. A nice UI built on top of this API eliminates the need for anyone to use a Google Sheet.

Sadly, we do not live in an ideal world, and this is just a code challenge. We can use the Google Sheet as the source of truth, but we have to spend a bit more time parsing the data out.

## My Approach:

1. First we load the data from the Google Sheets API.
2. Next, we parse each tab of the input sheet. The tabs have two basic formats - one in which the states are denoted in a table, and another in which the states are implied by the title of the tab. We need a different type of parser for each type of CSV.
3. Then, we build a big list of (carrier, coverage, state) objects like this:

```json
[
  { "carrier": "ALLSTATE", "coverage": "FIRE", "state": "IL" },
  { "carrier": "ALLSTATE", "coverage": "FIRE", "state": "IL" }
]
```

This is not the most efficient way to store the data (I discuss tradeoffs below), but for our purposes it will do just fine. This format also has the advantage of looking pretty similar to a relational database, which could make it easier to swap out later.

4. When a request comes in, we can look through this big array of coverage objects and pluck out the ones we want by state, coverage type, or both.

## Tradeoffs

- We import the data when the node app is started. This means that data could be stale if the sheet has been updated after the app starts up. In practice this doesn't really matter, because we would likely just import the data once into a DB, and then update it there.
- iterating over the entire list of carrier/coverage objects takes O(n) time. This is fine because its a pretty small dataset that fits easily in memory. In a relational database, we would add an index on Carrier, State, and even Coverage type to make it really snappy.

### Adding Data

Let's say that we want to add a new tab to the sheet. All we need to do is add an entry in the `config.json` file. As long as the format follows one of the two existing sheet formats, we should be able to parse it without a hitch!

### How to run the app

- Run app: `npm i && node app.js`
- Run tests: `npm run test`
