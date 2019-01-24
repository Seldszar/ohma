const yargs = require("yargs");

const { argv } = yargs
  .env()
  .option("port", {
    type: "number",
    describe: "the server port",
    default: 3000,
  })
  .option("sentry-dns", {
    type: "string",
    describe: "the Sentry DNS for error reporting",
    default: null,
  });

require("..")(argv);
