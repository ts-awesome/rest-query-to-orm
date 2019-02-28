import { TableMetaProvider, WhereBuilder, OrderBuilder, and, or, asc, desc, IOperandable } from '@viatsyshyn/ts-orm';
import { IWhereInput, IOrderBy, AND, OR, ASC, DESC, Operation } from '@viatsyshyn/ts-rest-query';

export function compileWhereFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T, query: IWhereInput): WhereBuilder<InstanceType<T>> {
  const filters = {
    [AND]: and,
    [OR]: or,
  };
  return (props) => filters[query.op](Object.keys(query.filter).map(prop => {
    const conditions = query.filter[prop];
    let res = Object.keys(conditions).reduce((a: IOperandable<T[any]>, op: Operation) => a[op](conditions[op]), props[prop]);
    return res;
  }) as any);
}

export function compileOrderFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T, query: IOrderBy): OrderBuilder<InstanceType<T>> {
  const order = {
    [ASC]: asc,
    [DESC]: desc,
  };
  return (props) => Object.keys(query).map(prop => order[query[prop]](props[prop]));
}
