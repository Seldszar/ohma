import { AddressInfo } from "net";
import yargs from "yargs";

import main from "..";

async function run(): Promise<void> {
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

  const server = main(argv);

  server.on("error", (error): void => {
    console.error(error);
  });

  server.on("listening", (): void => {
    console.info("Server is listening port %d...", (server.address() as AddressInfo).port);
  });
}

run();
