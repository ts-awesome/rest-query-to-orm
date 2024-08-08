import 'reflect-metadata';

import {
  TableMetaProvider,
  WhereBuilder,
  OrderBuilder,
  and,
  or,
  asc,
  desc,
  not,
  IOperandable,
  Select,
} from '@ts-awesome/orm';

import {
  ISimpleQuery,
  AND_OP,
  OR_OP,
  EQ_OP,
  NEQ_OP,
  GT_OP,
  GTE_OP,
  LT_OP,
  LTE_OP,
  REGEX_OP,
  REF_OP,
  NOT_OP,
  CONTAINS_OP,
} from '@ts-awesome/simple-query';

import {
  IOrderBy,
  ASC,
  DESC,
} from '@ts-awesome/rest-query';
import {FilterMetadataSymbol, IFilterInfo} from "./decorators";
import {Operandable} from "@ts-awesome/orm/dist/wrappers";

export const TableMetadataSymbol = Symbol.for('TableMetadata');

export { ISimpleQuery, IOrderBy, AND_OP, OR_OP, ASC, DESC, EQ_OP, NEQ_OP, GT_OP, GTE_OP, LT_OP, LTE_OP, REGEX_OP};

const filters = {
  [AND_OP]: and,
  [OR_OP]: or,
  [NOT_OP]: not,
};

export const LIKE_OP = '$like';
export const IN_OP = '$in';

const operationsMap = {
  [EQ_OP]: 'eq',
  [NEQ_OP]: 'neq',
  [GT_OP]: 'gt',
  [GTE_OP]: 'gte',
  [LT_OP]: 'lt',
  [LTE_OP]: 'lte',
  [REGEX_OP]: 'like',
  [LIKE_OP]: 'like',
  [IN_OP]: 'in',
  [CONTAINS_OP]: 'has',
};

export interface ReferenceResolver<T> {
  (x: string): IOperandable<T>;
}

function compile<T>(resolver: ReferenceResolver<T>, condition, op: string | null = AND_OP): IOperandable<unknown> {
  switch (op) {
    case null:
      if (typeof condition === 'object') {
        return compile(resolver, condition);
      }

      return condition;

    case REF_OP:
      return resolver(condition);

    case NOT_OP:
      if (Array.isArray(condition)) {
        return filters[op](condition.map(x => compile(resolver, x))[0]);
      }
    {
      const conds = Object.entries(condition).map(([op, condition]) => compile(resolver, condition, op));
      return filters[op](conds[0]);
    }

    case AND_OP:
    case OR_OP:
      if (Array.isArray(condition)) {
        return filters[op](...condition.map(x => compile(resolver, x)));
      }
    {
      const conds = Object.entries(condition).map(([op, condition]) => compile(resolver, condition, op));
      return conds.length > 1 ? filters[op](...conds) : conds[0];
    }
    case EQ_OP:
    case NEQ_OP:
    case GT_OP:
    case GTE_OP:
    case LT_OP:
    case LTE_OP:
    case LIKE_OP:
      if (Object.keys(condition).length > 1) {
        return and(...Object.entries(condition)
          .map(([field, value]) => resolver(field)[operationsMap[op]](compile(resolver, value, null))));
      }

      return Object.entries(condition)
        .map(([field, value]) => resolver(field)[operationsMap[op]](compile(resolver, value, null)))[0];

    case IN_OP:
    case CONTAINS_OP:
      return Object.entries(condition)
        .map(([field, value]) => resolver(field)[operationsMap[op]](value))[0];

    default:
      if (op.startsWith('$')) {
        throw new Error(`Operator ${JSON.stringify(op)} is not supported`);
      }

      return resolver(op).eq(compile(resolver, condition, null)) as any;
  }
}

// noinspection JSUnusedGlobalSymbols
export function compileQuery<T>(resolver: ReferenceResolver<T>, query?: ISimpleQuery): IOperandable<unknown> | undefined {
  if(!query || Object.keys(query).length < 1) {
    return undefined;
  }

  return compile(resolver, query);
}

export function compileWhereFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T, query?: ISimpleQuery): WhereBuilder<InstanceType<T>> | undefined {
  if(!query || Object.keys(query).length < 1) {
    return undefined;
  }

  if (Model[TableMetadataSymbol] != null) {
    return (props) => compile((field) => props[field], query);
  }

  const {model, fields}: IFilterInfo = Model[FilterMetadataSymbol]
  if (model == null) {
    throw new Error(`Model is required`);
  }
  const {primaryKey} = model[TableMetadataSymbol];

  return (props) => compile((field) => {
    return new Proxy({} as IOperandable<unknown>, {
      get(target, op) {
        return (value: unknown) => {
          const fieldInfo = fields.get(field);
          switch (fieldInfo?.kind) {
            case 'plain':
              return (typeof op === 'symbol') ? props[fieldInfo.name].toString() : props[fieldInfo.name][op](value);
            case 'relation':
              return props[fieldInfo.field].in(
                new Operandable('SUBQUERY', [(Select(fieldInfo.relation)
                  .columns((b)=> [b[fieldInfo.relationKey]])
                  .where((rel) => rel[fieldInfo.relationValue][op.toString()](value)) as never
                )]));
            case 'custom':
              if (typeof fieldInfo.operators[op.toString()] !== 'function') {
                throw new Error(`Operator ${JSON.stringify(op)} is not supported for field ${field}, got ${typeof fieldInfo.operators[op.toString()]}`);
              }

              return fieldInfo.operators[op.toString()](props[primaryKey], op.toString(), value);
            default:
              throw new Error(`no filtering info found for ${JSON.stringify(field)}`);
          }
        }
      }
    })

  }, query);
}

const order = {
  [ASC]: asc,
  [DESC]: desc,
};

export function compileOrderFor<T extends TableMetaProvider<InstanceType<T>>>(Model: T, query?: IOrderBy[]): OrderBuilder<InstanceType<T>> | undefined {

  if (!query || query.length < 1) {
    return undefined;
  }

  return (props) => query
    .map(x => Object.entries(x)[0])
    .filter(x => x)
    .map(([key, op]) => order[op](props[key]));
}
