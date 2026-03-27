const MAX_PAGE_SIZE = 100;

export const paginate = ({ page = 1, size = 25 }: { page?: number | string; size?: number | string }) => {
  const parsedPage = Math.max(1, parseInt(String(page), 10) || 1);
  const rawSize = parseInt(String(size), 10) || 25;
  const parsedSize = Math.min(Math.max(1, rawSize), MAX_PAGE_SIZE);
  return {
    offset: (parsedPage - 1) * parsedSize,
    limit: parsedSize,
    currentPage: parsedPage,
  };
};

function buildPageUrl(baseUrl: string, pageNum: number): string | null {
  if (!baseUrl || typeof baseUrl !== 'string') return null;
  try {
    const u = new URL(baseUrl);
    u.searchParams.set('page', String(pageNum));
    return u.toString();
  } catch {
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}page=${pageNum}`;
  }
}

export const constructPagination = ({
  count,
  limit,
  offset,
  currentPage,
  baseUrl,
}: {
  count: number;
  limit: number;
  offset: number;
  currentPage: number;
  baseUrl: string;
}) => {
  const lastPage = Math.ceil(count / limit) || 1;
  const links = {
    first: buildPageUrl(baseUrl, 1),
    last: buildPageUrl(baseUrl, lastPage),
    prev: currentPage > 1 ? buildPageUrl(baseUrl, currentPage - 1) : null,
    next: currentPage < lastPage ? buildPageUrl(baseUrl, currentPage + 1) : null,
  };
  const meta = {
    current_page: currentPage,
    from: offset + 1,
    last_page: lastPage,
    path: baseUrl,
    per_page: String(limit),
    to: Math.min(offset + limit, count),
    total: count,
  };
  return { links, meta };
};
