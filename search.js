// function to handle search requests.
// Normally I would add tests for something like this,
// but its a relatively simple function so I skipped them.
const handle = (body, carriers) => {
  try {
    const { state, coverage } = body;

    if (state) {
      carriers = carriers.filter((r) => {
        return r.state === state;
      });
    }

    if (coverage) {
      carriers = carriers.filter((r) => {
        return r.coverage == coverage;
      });
    }

    return { carriers, error: null };
  } catch (error) {
    return { carriers: null, error };
  }
};

module.exports = { handle };
