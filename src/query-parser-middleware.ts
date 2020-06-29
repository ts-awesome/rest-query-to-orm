import { compileOrderFor, compileWhereFor } from './compiler';
import { TableMetaProvider } from '@viatsyshyn/ts-orm';
import { parser } from '@viatsyshyn/ts-rest-query';

import { IMiddleware, IHttpRequest } from '@viatsyshyn/ts-rest';
import { D } from './decorator-utils';
import { injectable } from 'inversify'

export function QueryParserMiddlewareFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T): Function {

  const Middleware = class implements IMiddleware  {
    public async handle(req: IHttpRequest): Promise<void> {
      const {query, offset, limit, countOnly, orderBy} = parser(req.query);
      req.query.query = compileWhereFor(Model, query);
      req.query.limit = limit;
      req.query.offset = offset;
      req.query.orderBy = compileOrderFor(Model, orderBy);
      req.query.countOnly = countOnly;
    }
  };

  Object.defineProperty(Middleware, 'name', { value: `${Model.name}QueryParserMiddleware` });
  return D([injectable()], Middleware);
}
