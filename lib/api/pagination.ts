type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

export type PaginationInput = {
  page: number;
  limit: number;
  skip: number;
  take: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
}

export function parsePagination(
  request: Request,
  options: PaginationOptions = {}
): PaginationInput {
  const defaultLimit = options.defaultLimit ?? 50;
  const maxLimit = options.maxLimit ?? 100;
  const { searchParams } = new URL(request.url);

  const page = parsePositiveInt(searchParams.get('page'), 1);
  const requestedLimit = parsePositiveInt(searchParams.get('limit'), defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

export function buildPaginationMeta(input: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  const totalPages = input.total === 0 ? 1 : Math.ceil(input.total / input.limit);
  const hasMore = input.page * input.limit < input.total;

  return {
    page: input.page,
    limit: input.limit,
    total: input.total,
    totalPages,
    hasMore,
  };
}
