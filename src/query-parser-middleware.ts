import { compileOrderFor, compileWhereFor } from './compiler';
import { TableMetaProvider } from '@viatsyshyn/ts-orm';
import { ISelectQueryInput, parser } from '@viatsyshyn/ts-rest-query';

import { IMiddleware, IHttpRequest } from '@viatsyshyn/ts-rest';
import { DecoratorUtils } from './decorator-utils';
import { injectable } from 'inversify'

export function QueryParserMiddlewareFor<T extends TableMetaProvider<InstanceType<T>>>(Model:T): Function {
 
  let middleware = class implements IMiddleware  {
    public async handle(req: IHttpRequest): Promise<void> {
      const query: ISelectQueryInput = parser(req.query);
      req.params.query = compileWhereFor(Model, query.where || {filter: {}, op: 'OR'});
      req.params.limit = query.limit;
      req.params.offset = query.offset;
      req.params.orderBy = compileOrderFor(Model, query.orderBy || {});
      req.params.countOnly = query.columns && query.columns.length === 1 && query.columns[0] === 'count(*)'
    }
  }

  Object.defineProperty(middleware, 'name', { value: `${Model.name}QueryParserMiddleware` });
  middleware = DecoratorUtils.D([injectable()], middleware);

  return middleware;
}