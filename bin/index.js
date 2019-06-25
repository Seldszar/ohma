const yargs = require("yargs");
const bootstrap = require("..");

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

const server = bootstrap(argv);

server.on("error", error => {
  console.error(error);
});

server.on("listening", () => {
  console.info("Server is listening port %d...", server.address().port);
});
