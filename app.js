const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const port = 3000;

// global var to store our coverage objects
let allCarriers = [];

const SheetsHandler = require("./SheetsHandler");
const { handle } = require("./search");
let sheets = new SheetsHandler();

// Routes
app.get("/google/redirect", (req, res) => {
  res.send(req.query.code);
});

// GET route to view all carrier preferences
app.get("/carriers", (req, res) => {
  try {
    res.send(allCarriers);
  } catch (e) {
    res.status(500).send(`Whoops: ${e}`);
  }
});

// Main search handler
app.post("/search", (req, res) => {
  const { carriers, error } = handle(req.body, allCarriers);

  if (error) {
    res.status(500).send({ error });
  } else {
    if (carriers.length === 0) {
      res.status(404).send({ carriers: [], error: "No carriers found" });
    } else {
      res.status(200).send({ carriers });
    }
  }
});

(async () => {
  app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port} 🚀`)
  );

  // Do setup after app starts, because we need the google redirect path
  // to accept requests before this kicks off
  sheets
    .init()
    .then(async () => {
      console.log("⏱ importing data from Google Sheets...");
      allCarriers = await sheets.importData();
    })
    .catch((e) => console.error(e));
})();
