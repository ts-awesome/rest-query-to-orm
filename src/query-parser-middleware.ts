import {type Container, injectable} from 'inversify'

import {OrderBuilder, TableMetaProvider, WhereBuilder} from '@ts-awesome/orm';
import {DescribeQueryParams, parser} from '@ts-awesome/rest-query';
import {IHttpRequest, IMiddleware} from '@ts-awesome/rest';
import _, {readable} from "@ts-awesome/model-reader";

import {FilterMetadataSymbol} from "./decorators";
import {compileOrderFor, compileWhereFor, TableMetadataSymbol} from './compiler';
import {D} from './decorator-utils';

export const GetListQuerySymbol = Symbol.for('ListQuery');

export class GetListQueryInput<T=unknown> {
  @readable(true)
  public readonly limit?: number

  @readable(true)
  public readonly offset?: number

  @readable(Object, true)
  public readonly orderBy?: OrderBuilder<T>

  @readable(true)
  public readonly countOnly?: boolean

  @readable(Object, true)
  public readonly query?: WhereBuilder<T>
}


export declare type Class<T> = new (...args: any) => T;

export function QueryParserMiddlewareFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T): Class<IMiddleware> {
  const Middleware = class implements IMiddleware  {
    public async handle({query: raw, container}: IHttpRequest & {container?: Container}): Promise<void> {
      const {query, offset, limit, countOnly, orderBy} = parser(raw);

      const model = _({
        query: compileWhereFor(Model, query),
        orderBy: compileOrderFor(Model, orderBy),
        countOnly,
        limit,
        offset,
      }, GetListQueryInput, true);

      container?.bind(GetListQuerySymbol).toConstantValue(model);
    }
  };

  Object.defineProperty(Middleware, 'name', { value: `${Model.name}QueryParserMiddleware` });
  return D([injectable()], Middleware);
}

interface IOpenApiParameterArgs {
  description: string;
  schema: {
    type: string;
    minimum?: number;
    default?: any;
  }
}

export function DescribeQueryParamsFor<T>(Model: Class<T>, defaultLimit = 10): Record<string, IOpenApiParameterArgs> {
  const {fields}: {fields?: Map<string, unknown>} = Model[FilterMetadataSymbol] || Model[TableMetadataSymbol] || {};

  if (fields == null) {
    throw new Error(`Model expected to be decorated with @dbTable or @filterable`);
  }

  return DescribeQueryParams([...fields.keys()], defaultLimit);
}
