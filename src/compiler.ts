import { TableMetaProvider, WhereBuilder, OrderBuilder, and, or, asc, desc, IOperandable } from '@viatsyshyn/ts-orm';
import { IWhereInput, IOrderBy, AND, OR, ASC, DESC, Operation, OP_EQ, OP_NEQ, OP_GT, OP_GTE, OP_LT, OP_LTE, OP_SEARSH, OP_INCLUDES } from '@viatsyshyn/ts-rest-query';

const filters = {
  [AND]: and,
  [OR]: or,
};

const operationsMap = {
  [OP_EQ]: 'eq',
  [OP_NEQ]: 'neq',
  [OP_GT]: 'gt',
  [OP_GTE]: 'gte',
  [OP_LT]: 'lt',
  [OP_LTE]: 'lte',
  [OP_SEARSH]: 'like',
  [OP_INCLUDES]: 'in'
};

export function compileWhereFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T, query?: IWhereInput): WhereBuilder<InstanceType<T>> | undefined {

  if(!query || Object.keys(query.filter).length < 1) {
    return undefined;
  }

  return (props) => filters[query.op](...Object.keys(query.filter).map(prop => {
    const conditions = query.filter[prop];
    return Object.keys(conditions)
      .reduce((a: IOperandable<T[any]>, op: Operation | any) => a[operationsMap[op]](conditions[op]), props[prop]);
  }) as any);
}

const order = {
  [ASC]: asc,
  [DESC]: desc,
};

export function compileOrderFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T, query?: IOrderBy): OrderBuilder<InstanceType<T>> | undefined {

  if(!query || Object.keys(query).length < 1) {
    return undefined;
  }

  return (props) => Object.keys(query).map(prop => order[query[prop]](props[prop]));
}
