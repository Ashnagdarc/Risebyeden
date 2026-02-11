import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const REQUEST_ID_HEADER = 'x-request-id';

export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
};

function parsePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function getRequestContext(request: Request): RequestContext {
  const requestId = request.headers.get(REQUEST_ID_HEADER)?.trim() || crypto.randomUUID();

  return {
    requestId,
    method: request.method.toUpperCase(),
    path: parsePath(request.url),
  };
}

export function bindRequestContextToSentry(context: RequestContext): void {
  Sentry.setTag('request_id', context.requestId);
  Sentry.setTag('http_method', context.method);
  Sentry.setContext('http_request', {
    id: context.requestId,
    method: context.method,
    path: context.path,
  });
}

export function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

