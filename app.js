const express = require("express");
const app = express();
const port = 3000;

const SheetsHandler = require("./SheetsHandler");
let sheets = new SheetsHandler();

(async () => {
  app.get("/heartbeat", (req, res) => res.send("OK"));
  app.get("/google/redirect", (req, res) => {
    console.log(req.params);
    res.send(req.query.code);
  });

  app.get("/carriers", async (req, res) => {
    const carriers = await sheets.carriers();

    res.send(JSON.stringify(carriers));
  });

  app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
  );

  // Do setup after app starts, because we need the google redirect path
  // to accept requests
  await sheets.init();
  await sheets.importData();
})();
