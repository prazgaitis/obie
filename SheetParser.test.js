const SheetParser = require("./SheetParser");

test("it throws an error when the input is malformed", () => {
  let parser = new SheetParser();

  const input = [
    ["Carrier", "Not a state", "Something else"],
    ["Allstate", "Both", "Both"],
  ];

  expect(() => {
    parser.parse(input, { type: "PL" });
  }).toThrowError(/incorrect sheet format/i);
});

test("it uses parseWithStates when states are passed in", () => {
  let parser = new SheetParser();
  parser.parseWithStates = jest.fn();
  parser.parseByType = jest.fn();

  parser.parse("some input", { states: ["IL"] });
  expect(parser.parseWithStates).toBeCalled();
  expect(parser.parseByType).not.toBeCalled();
});

test("it uses parseByType when type is passed in", () => {
  let parser = new SheetParser();
  parser.parseWithStates = jest.fn();
  parser.parseByType = jest.fn();

  parser.parse("some input", { type: "PL" });
  expect(parser.parseWithStates).not.toBeCalled();
  expect(parser.parseByType).toBeCalled();
});

test("it correctly parses Tab 1 (PL- IL/IN/MI) rows into coverage objects", () => {
  let parser = new SheetParser();

  const input = [
    ["Carrier", "IL", "IN", "MI"],
    ["Allstate", "Both", "Both"],
  ];

  const expected = [
    { carrier: "Allstate", state: "IL", coverage: "FIRE" },
    { carrier: "Allstate", state: "IL", coverage: "AUTO" },
    { carrier: "Allstate", state: "IN", coverage: "FIRE" },
    { carrier: "Allstate", state: "IN", coverage: "AUTO" },
  ];

  expect(parser.parse(input, { type: "PL" })).toEqual(expected);
});

test("it correctly parses Tab 2 (PL - FL) sheet into coverage objects", () => {
  let parser = new SheetParser();

  const input = [
    ["Carrier", "FL"],
    ["American Integrity", "FIRE"],
  ];

  const expected = [
    { carrier: "American Integrity", state: "FL", coverage: "FIRE" },
  ];

  expect(parser.parse(input, { type: "PL" })).toEqual(expected);
});

test("it correctly parses Tab 3 (Flood) rows into coverage objects", () => {
  let parser = new SheetParser();

  const input = [
    ["Carrier", "IL", "IN", "MI", "FL"],
    ["CatCoverage", "Yes", "Yes", "Yes", "Yes"],
  ];

  const expected = [
    { carrier: "CatCoverage", state: "IL", coverage: "FLOOD" },
    { carrier: "CatCoverage", state: "IN", coverage: "FLOOD" },
    { carrier: "CatCoverage", state: "MI", coverage: "FLOOD" },
    { carrier: "CatCoverage", state: "FL", coverage: "FLOOD" },
  ];

  expect(parser.parse(input, { type: "FLOOD" })).toEqual(expected);
});

test("it correctly parses Tab 4 (PL - Other States) rows into coverage objects", () => {
  let parser = new SheetParser();

  const input = [
    [
      "Carrier",
      "AL",
      "AR",
      "AZ",
      "CA",
      "CO",
      "GA",
      "IA",
      "KY",
      "MD",
      "MO",
      "NC",
      "NV",
      "NY",
      "OH",
      "OK",
      "SC",
      "SD",
      "TN",
      "TX",
      "VA",
      "WI",
    ],
    [
      "Chubb",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "BOTH",
      "",
      "BOTH",
    ],
  ];

  const expected = [
    { carrier: "Chubb", state: "OH", coverage: "FIRE" },
    { carrier: "Chubb", state: "OH", coverage: "AUTO" },
    { carrier: "Chubb", state: "SC", coverage: "FIRE" },
    { carrier: "Chubb", state: "SC", coverage: "AUTO" },
  ];

  expect(parser.parse(input, { type: "PL" })).toEqual(expected);
});

test("it correctly parses Tab 5 (CL STATES APTS) rows into coverage objects", () => {
  let parser = new SheetParser();

  const input = [
    [
      "Carrier",
      "AL",
      "AZ",
      "CA",
      "CO",
      "GA",
      "FL",
      "IA",
      "KS",
      "KY",
      "IL",
      "IN",
      "MD",
      "MI",
      "MO",
      "NC",
      "NV",
      "NY",
      "OH",
      "OK",
      "PA",
      "SD",
      "SC",
      "TN",
      "TX",
      "VA",
      "WI",
    ],
    [
      "CIBA",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
      "Yes",
    ],
  ];

  const expected = [
    { carrier: "CIBA", state: "AL", coverage: "APARTMENT" },
    { carrier: "CIBA", state: "AZ", coverage: "APARTMENT" },
  ];

  expect(parser.parse(input, { type: "APARTMENT" })).toEqual(
    expect.arrayContaining(expected)
  );
});

test("it correctly parses Tab 6 (CL - IL/IN/MI/OH) rows into coverage objects", () => {
  const parser = new SheetParser();

  const input = [
    ["Carrier", "SFR's (1-4 Units)", "4+ units"],
    ["Arcana", "Yes"],
    ["Auto Owners", "Yes", "Yes"],
    ["BHHC", "Yes"],
    ["CIBA", "", "Yes"],
    ["CNA"],
    ["CORE Programs", "", "Yes"],
    ["Distinguished", "IL (no frame)", "IL (no frame)"],
    ["ForemostSTAR"],
    ["Greater New York", "", "Yes"],
    ["Guard", "Yes - PL's", "Yes - CL's"],
    ["Nationwide", "", "Yes"],
    ["New Empire Group"],
    ["Openly", "Yes"],
    ["Seneca", "Yes", "Yes"],
    ["State Auto", "Yes -PL's", "Yes - CL's"],
    ["Strata", "", "Yes"],
    ["Swyfft", "", "IL ONLY"],
    ["Travelers", "Yes - PL's"],
    ["Travelers - Big I of IL", "", "Yes"],
    ["US Assure"],
  ];

  const expected = [
    { carrier: "Arcana", state: "IL", coverage: "SFR" },
    { carrier: "Arcana", state: "IN", coverage: "SFR" },
    { carrier: "Arcana", state: "MI", coverage: "SFR" },
    { carrier: "Arcana", state: "OH", coverage: "SFR" },
    { carrier: "Auto Owners", state: "IN", coverage: "MULTI_UNIT" },
    { carrier: "Distinguished", state: "IL", coverage: "SFR - NO FRAME" },
    {
      carrier: "Distinguished",
      state: "IL",
      coverage: "MULTI_UNIT - NO FRAME",
    },
    { carrier: "Swyfft", state: "IL", coverage: "MULTI_UNIT" },
    { carrier: "State Auto", state: "IL", coverage: "MULTI_UNIT - CLs" },
  ];

  const notExpected = [
    expect.objectContaining({ carrier: "CNA" }),
    { carrier: "Swyfft", state: "IN", coverage: "SFR" },
  ];

  const states = ["IL", "IN", "MI", "OH"];

  const actual = parser.parse(input, { states });

  // run each test case individually so that we can see which one failed more easily.
  for (let e of expected) {
    expect(actual).toEqual(expect.arrayContaining([e]));
  }

  expect(actual).toEqual(expect.not.arrayContaining(notExpected));
});

test("it correctly parses Tab 7 (CL - FL) rows into coverage objects", () => {
  const parser = new SheetParser();

  const input = [
    ["Carrier", "SFR's (1-4 Units)", "4+ units"],
    ["Arcana", "Yes"],
  ];

  const expected = [{ carrier: "Arcana", state: "FL", coverage: "SFR" }];
  const notExpected = [{ carrier: "Swyfft", state: "FL", coverage: "SFR" }];

  const states = ["FL"];
  const actual = parser.parse(input, { states });

  // run each test case individually so that we can see which one failed more easily.
  for (let e of expected) {
    expect(actual).toEqual(expect.arrayContaining([e]));
  }

  for (let e of notExpected) {
    expect(actual).toEqual(expect.not.arrayContaining([e]));
  }
});

test("it correctly parses Tab 8 (CL - TX) rows into coverage objects", () => {
  const parser = new SheetParser();

  const input = [
    ["Carrier", "SFR's (1-4 Units)", "4+ units"],
    ["Arcana", "Yes"],
  ];

  const expected = [{ carrier: "Arcana", state: "TX", coverage: "SFR" }];
  const notExpected = [{ carrier: "Swyfft", state: "TX", coverage: "SFR" }];

  const states = ["TX"];
  const actual = parser.parse(input, { states });

  // run each test case individually so that we can see which one failed more easily.
  for (let e of expected) {
    expect(actual).toEqual(expect.arrayContaining([e]));
  }

  for (let e of notExpected) {
    expect(actual).toEqual(expect.not.arrayContaining([e]));
  }
});

test("it correctly parses Tab 9 (CL - OK) rows into coverage objects", () => {
  const parser = new SheetParser();

  const input = [
    ["Carrier", "SFR's (1-4 Units)", "4+ units"],
    ["Nationwide", "", "Yes"],
  ];

  const expected = [
    { carrier: "Nationwide", state: "OK", coverage: "MULTI_UNIT" },
  ];
  const notExpected = [{ carrier: "Nationwide", state: "OK", coverage: "SFR" }];

  const states = ["OK"];
  const actual = parser.parse(input, { states });

  // run each test case individually so that we can see which one failed more easily.
  for (let e of expected) {
    expect(actual).toEqual(expect.arrayContaining([e]));
  }

  for (let e of notExpected) {
    expect(actual).toEqual(expect.not.arrayContaining([e]));
  }
});

test("it correctly parses Tab 10 (CL - TN) rows into coverage objects", () => {
  const parser = new SheetParser();

  const input = [
    ["Carrier", "SFR's (1-4 Units)", "4+ units"],
    ["Guard", "", "Yes - CL's"],
  ];

  const expected = [
    { carrier: "Guard", state: "TN", coverage: "MULTI_UNIT - CLs" },
  ];
  const notExpected = [{ carrier: "Swyfft", state: "TN", coverage: "SFR" }];

  const states = ["TN"];
  const actual = parser.parse(input, { states });

  // run each test case individually so that we can see which one failed more easily.
  for (let e of expected) {
    expect(actual).toEqual(expect.arrayContaining([e]));
  }

  for (let e of notExpected) {
    expect(actual).toEqual(expect.not.arrayContaining([e]));
  }
});
