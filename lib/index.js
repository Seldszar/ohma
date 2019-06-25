const Sentry = require("@sentry/node");
const got = require("got");
const http = require("http");

function bootstrap(argv) {
  Sentry.init({
    dsn: argv.sentryDns,
  });

  const captureError = (error, context) => {
    console.error(error.message, error);

    if (argv.sentryDns) {
      Sentry.captureException(error, context);
    }
  };

  const server = http.createServer((request, response) => {
    if (request.url === "/") {
      return response.end();
    }

    const {
      // eslint-disable-next-line no-unused-vars
      headers: { host, ...headers },
      method,
    } = request;

    const message = got.stream(request.url.substr(1), {
      throwHttpErrors: false,
      decompress: false,
      body: request,
      headers,
      method,
    });

    message.on("error", error => {
      const { statusCode = 500, statusMessage = "Internal Server Error" } = error;

      captureError(error, {
        request,
      });

      response.writeHead(statusCode, {
        "Content-Length": Buffer.byteLength(statusMessage),
        "Content-Type": "text/plain",
      });

      response.end(statusMessage);
    });

    response.setHeader("Access-Control-Allow-Origin", "*");
    message.pipe(response);
  });

  server.listen(argv.port, error => {
    if (error) {
      captureError(error);
    }
  });

  return server;
}

module.exports = bootstrap;
