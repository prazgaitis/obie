### Carrier Preferences API

#### Overview
- The service receives a request with a US state and desired type of coverage.
- The services returns a JSON response containing a list of all carriers that offer the specified type of coverage in the desired US state.

#### Examples
A request might look like this: 

```
POST /carriers/search
state=FL&coverage_type=AUTO
```

Which returns a response like this: 
```json
{
    "carriers": [
        {
            "name": "Allstate",
            "coverage_types": [
                "FIRE",
                "AUTO"
            ] 
        }
    ]
}
```

#### Loading data

In order for the API to work, we need to load the data from the provided Google Sheet. A naive solution might involve manually entering the data from the Google Sheet into one canonical source-of-truth CSV or JSON file. Our web service can read this file into memory, parse it, and use it to return the correct response. The problem with this approach is that you now have two sources of data - the source-of-truth file and the Google Sheet. Both the source-of-truth file and the Google Sheet need to be updated when something changes. The data can get out of sync, or we could make a mistake when copying data. 

In an ideal world, we have all of the necessary data in a database. Our web service uses this database to return the correct response. Users can also update the data if we add a new carrier or a carrier's coverage changes. A nice interface built on top of this API eliminates the need for anyone to use a Google Sheet.

Sadly, we do not live in an ideal world, and this is just a code challenge. We can use the Google Sheet as the source of truth, but we have to spend a bit more time parsing the data out. 

Let's see how it goes!

#### Questions / Assumptions
1. For PL, it looks like there are 3 types of coverage: FIRE, FLOOD, and AUTO. However, some entries in the sheet list BOTH. I assumed that this means FIRE & AUTO.
