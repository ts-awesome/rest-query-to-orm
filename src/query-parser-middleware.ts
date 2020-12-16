import { compileOrderFor, compileWhereFor } from './compiler';
import { TableMetaProvider } from '@ts-awesome/orm';
import { parser } from '@ts-awesome/rest-query';

import { IMiddleware } from '@ts-awesome/rest';
import { D } from './decorator-utils';
import { injectable } from 'inversify'

export function QueryParserMiddlewareFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T): Function {

  const Middleware = class implements IMiddleware  {
    public async handle({query: _}: any): Promise<void> {
      const {query, offset, limit, countOnly, orderBy} = parser(_);
      _.query = compileWhereFor(Model, query);
      _.limit = limit;
      _.offset = offset;
      _.orderBy = compileOrderFor(Model, orderBy);
      _.countOnly = countOnly;
    }
  };

  Object.defineProperty(Middleware, 'name', { value: `${Model.name}QueryParserMiddleware` });
  return D([injectable()], Middleware);
}
