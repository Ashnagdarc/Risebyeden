import 'dotenv/config';
import * as Sentry from '@sentry/nextjs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  sendDefaultPii: false,
});

const baseServer = new McpServer({
  name: 'risebyeden-mcp',
  version: '0.1.0',
});

const server = Sentry.wrapMcpServerWithSentry
  ? Sentry.wrapMcpServerWithSentry(baseServer)
  : baseServer;

const transport = new StdioServerTransport();

await server.connect(transport);
