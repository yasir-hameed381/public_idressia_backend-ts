import { Op } from 'sequelize';
import { paginate, constructPagination } from './utilityServices';

type ModelInstance = {
  findAndCountAll: (opts: {
    where?: Record<string, unknown>;
    offset: number;
    limit: number;
    order?: [string, string][];
  }) => Promise<{ count: number; rows: unknown[] }>;
};

export async function getList<T>({
  model,
  page = 1,
  size = 25,
  requestUrl = '',
  search = '',
  searchFields = [],
  where: extraWhere = {},
  order = [['id', 'ASC']],
}: {
  model: ModelInstance;
  page?: number | string;
  size?: number | string;
  requestUrl?: string;
  search?: string;
  searchFields?: string[];
  where?: Record<string, unknown>;
  order?: [string, string][];
}): Promise<{ data: T[]; links: unknown; meta: unknown }> {
  const { offset, limit, currentPage } = paginate({ page, size });
  const where: Record<string, unknown> = { ...extraWhere };
  if (search && searchFields.length > 0) {
    (where as Record<symbol, unknown>)[Op.or as unknown as symbol] = searchFields.map((field) => ({
      [field]: { [Op.like]: `%${search}%` },
    }));
  }
  const { count, rows: data } = await model.findAndCountAll({
    where: Object.keys(where).length ? where : undefined,
    offset,
    limit,
    order: order as [string, string][],
  });
  const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
  return { data: data as T[], links, meta };
}
