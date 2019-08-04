import { captureException, init, setContext } from "@sentry/node";
import got, { GotError, HTTPError } from "got";
import http, { Server } from "http";
import stream from "stream";

interface ApplicationOptions {
  port: number;
  sentryDns?: string;
}

interface FormatError {
  statusCode: number;
  statusMessage: string;
}

function formatError(error: GotError): FormatError {
  if (error instanceof HTTPError) {
    return error;
  }

  let statusCode = parseInt(error.code, 10);
  let statusMessage = error.message || "Internal Server Error";

  if (isNaN(statusCode)) {
    statusCode = 500;
  }

  return {
    statusCode,
    statusMessage,
  };
}

export default function main(options: ApplicationOptions): Server {
  init({
    dsn: options.sentryDns,
  });

  const captureError = (error: Error, context?: object): void => {
    console.error(error.message, error);

    if (options.sentryDns) {
      if (context) {
        Object.entries(context).forEach(([name, value]): void => {
          setContext(name, value);
        });
      }

      captureException(error);
    }
  };

  const server = http.createServer((request, response): void => {
    if (request.url === "/") {
      return response.end();
    }

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      headers: { host, ...headers },
      method,
    } = request;

    const message = got.stream(request.url.substr(1), {
      throwHttpErrors: false,
      decompress: false,
      headers,
      method,
    });

    message.on("error", (error): void => {
      const { statusCode, statusMessage } = formatError(error);

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
    stream.pipeline(request, message, response, (): void => {});
  });

  server.on("error", (error): void => {
    captureError(error);
  });

  return server.listen(options.port);
}
