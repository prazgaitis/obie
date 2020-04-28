/* 
    The SheetParser takes a list of rows and normalizes it into a 'coverage object'.
    A coverage object is just a carrier name, a state, and a coverage type,  
    which is similar to what we might find in a database table for carrier coverage.

    An example record looks like this:

    {
        carrier: "Allstate",
        state: "IL",
        coverage: "AUTO"
    }
*/

const { isValidState } = require("./helper");

const transformPL = (carrier, state, entry) => {
  entry = entry.toUpperCase();

  // Since the sheet is a bit inconsistent, we want to substitute some of the entries
  // for something a bit different. Eg for PL, "BOTH" means "FIRE" & "AUTO"

  switch (entry) {
    // Assuming that BOTH = FIRE & AUTO
    case "BOTH":
      return [
        { carrier, state, coverage: "FIRE" },
        { carrier, state, coverage: "AUTO" },
      ];
    case "FIRE/FLOOD":
      return [
        { carrier, state, coverage: "FIRE" },
        { carrier, state, coverage: "FLOOD" },
      ];
    default:
      return [{ carrier, state, coverage: entry }];
  }
};

const transformCL = (carrier, states, entry, type) => {
  entry = entry.toUpperCase();

  switch (entry) {
    case "YES":
      return states.map((state) => {
        return { carrier, state, coverage: type };
      });
    case "IL ONLY":
      return [{ carrier, state: "IL", coverage: type }];
    case "IL (NO FRAME)":
      return [
        { carrier, state: "IL", coverage: `${type} - NO FRAME` },
        { carrier, state: "IL", coverage: `${type} - NO FRAME` },
      ];
    case "YES - PL'S":
      return states.map((state) => {
        return { carrier, state, coverage: `${type} - PLs` };
      });
    case "YES -PL'S":
      return states.map((state) => {
        return { carrier, state, coverage: `${type} - PLs` };
      });
    case "YES - CL'S":
      return states.map((state) => {
        return { carrier, state, coverage: `${type} - CLs` };
      });
    default:
      return states.map((state) => {
        return { carrier, state, coverage: "UNKNOWN" };
      });
  }
};

const transformFlood = (carrier, state, entry) => {
  entry = entry.toUpperCase();

  if (entry === "YES") {
    return [{ carrier, state, coverage: "FLOOD" }];
  } else {
    return [{ carrier, state, coverage: entry }];
  }
};

const transformApts = (carrier, state, entry) => {
  entry = entry.toUpperCase();

  if (entry === "YES") {
    return [{ carrier, state, coverage: "APARTMENT" }];
  } else {
    return [{ carrier, state, coverage: entry }];
  }
};

const getTransformer = (type) => {
  return {
    FLOOD: transformFlood,
    PL: transformPL,
    APARTMENT: transformApts,
  }[type];
};

const parse = (rows, options = {}) => {
  const { states, type } = options;

  return Boolean(type)
    ? parseByType(rows, type)
    : parseWithStates(rows, states);
};

const parseByType = (rows, type) => {
  const header = rows.shift();
  const [_, ...states] = header;
  const statesAreValid = states.every((s) => isValidState(s));

  if (!statesAreValid) {
    throw new Error(
      "Incorrect sheet format!. Expecting header with Carrier, State, State, ..."
    );
  }

  const results = [];

  // Iterate over all the rows
  for (let row of rows) {
    // pull out the carrier name and coverage in each state
    const [carrier, ...stateCoverage] = row;

    // Pluck out each coverage type for each state
    for (let i = 0; i < states.length; i++) {
      // skip if there is no coverage in that state
      if (!Boolean(stateCoverage[i])) {
        continue;
      }

      // We need to transform this input into a "coverage object"
      const transformer = getTransformer(type);
      const transformed = transformer.call(
        this,
        carrier,
        states[i],
        stateCoverage[i]
      );

      results.push(transformed);
    }
  }

  // results is an array of arrays, so we need to flatten it
  return results.flat();
};

// Use this parser when states are not specified in the sheet
const parseWithStates = (rows, states) => {
  if (!states.every((s) => isValidState(s))) {
    throw new Error("Invalid state!");
  }
  const header = rows.shift();
  const [_, ...buildingTypes] = header;
  const validBuildingType = buildingTypes.every((t) =>
    ["SFR's (1-4 Units)", "4+ units"].includes(t)
  );

  if (!validBuildingType) {
    throw new Error(
      "Incorrect sheet format!. Expecting header with Carrier, SFR's (1-4 Units), 4+ units"
    );
  }

  const results = [];

  // Iterate over all the rows
  for (let row of rows) {
    // pull out the carrier name and coverage in each state
    const [carrier, sfr, multiUnit] = row;

    // check if there is an entry for SFR
    if (Boolean(sfr)) {
      results.push(transformCL(carrier, states, sfr, "SFR"));
    }

    // check if there is an entry for MULTI-UNIT
    if (Boolean(multiUnit)) {
      results.push(transformCL(carrier, states, multiUnit, "MULTI_UNIT"));
    }
  }

  // results is an array of arrays, so we need to flatten it
  return results.flat();
};

module.exports = { parse };
