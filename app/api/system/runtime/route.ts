import os from 'node:os';
import { NextResponse } from 'next/server';
import { bindRequestContextToSentry, getRequestContext, withRequestId } from '@/lib/observability/request-context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestContext = getRequestContext(request);
  bindRequestContextToSentry(requestContext);

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol = forwardedProto || new URL(request.url).protocol.replace(':', '');
  const nodeName = process.env.APP_NODE_NAME?.trim() || os.hostname();

  return withRequestId(
    NextResponse.json(
      {
        nodeName,
        protocol,
        runtime: process.version,
        serverTime: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    ),
    requestContext.requestId,
  );
}
