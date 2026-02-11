import { NextResponse } from 'next/server';
import { z } from 'zod';

type ValidationSuccess<T> = {
  success: true;
  data: T;
};

type ValidationFailure = {
  success: false;
  response: NextResponse;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function buildValidationErrorResponse(result: z.ZodError): NextResponse {
  const issues = result.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }));

  return NextResponse.json(
    {
      error: 'Invalid request payload',
      issues,
    },
    { status: 400 }
  );
}

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      response: buildValidationErrorResponse(parsed.error),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

export function parseQuery<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): ValidationResult<z.infer<T>> {
  const queryObject = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(queryObject);

  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid query parameters', issues: parsed.error.issues.map((issue) => issue.message) },
        { status: 400 }
      ),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
