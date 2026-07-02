declare module "serve-handler" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  interface ServeHandlerConfig {
    public?: string;
    [key: string]: unknown;
  }

  function serveHandler(
    request: IncomingMessage,
    response: ServerResponse,
    config?: ServeHandlerConfig
  ): Promise<void>;

  export default serveHandler;
}
