import { compileOrderFor, compileWhereFor } from './compiler';
import { TableMetaProvider } from '@viatsyshyn/ts-orm';
import { ISelectQueryInput, parser, COUNT_COLUMN } from '@viatsyshyn/ts-rest-query';

import { IMiddleware, IHttpRequest } from '@viatsyshyn/ts-rest';
import { DecoratorUtils } from './decorator-utils';
import { injectable } from 'inversify'

export function QueryParserMiddlewareFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T): Function {

  let Middleware = class implements IMiddleware  {
    public async handle(req: IHttpRequest): Promise<void> {
      const query: ISelectQueryInput = parser(req.query);
      const countOnly = !!query.columns && query.columns.length === 1 && query.columns[0] === COUNT_COLUMN;
      req.query.query = compileWhereFor(Model, query.where) as any;
      req.query.limit = query.limit as any;
      req.query.offset = query.offset as any;
      req.query.orderBy = compileOrderFor(Model, query.orderBy) as any;
      req.query.countOnly = countOnly as any;
    }
  };

  Object.defineProperty(Middleware, 'name', { value: `${Model.name}QueryParserMiddleware` });
  Middleware = DecoratorUtils.D([injectable()], Middleware);

  return Middleware;
}
