import { Request } from 'express';
import { IMiddlewareFunction } from './interfaces';
import { compileOrderFor, compileWhereFor } from './compiler';
import { TableMetaProvider } from '@viatsyshyn/ts-orm';
import { ISelectQueryInput, parser } from '@viatsyshyn/ts-rest-query';

export function QueryParserMiddlewareFor<T extends TableMetaProvider<InstanceType<T>>>(Model:T): IMiddlewareFunction {
  return async function (req: Request): Promise<void> {
    const query: ISelectQueryInput = parser(req.query);
    req.params.query = compileWhereFor(Model, query.where || {filter: {}, op: 'OR'});
    req.params.limit = query.limit;
    req.params.offset = query.offset;
    req.params.orderBy = compileOrderFor(Model, query.orderBy || {});
    req.params.countOnly = query.columns && query.columns.length === 1 && query.columns[0] === 'count(*)'
  }
}