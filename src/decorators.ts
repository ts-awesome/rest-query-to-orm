import {IOperandable, TableMetaProvider} from "@ts-awesome/orm";

export declare type Class<T> = new (...args: any) => T;

interface RelationDef<T extends Record<string, unknown>, X extends Record<string, unknown> = Record<string, any>> {
  match: keyof T;
  table: Class<X>;
  key: keyof X;
  value: keyof X;
}

export interface Compiler<T> {
  (primary: IOperandable<unknown>, op: string, value: T): IOperandable<boolean>;
}

export const FilterMetadataSymbol = Symbol.for('FilterMetadataSymbol');

interface IFilterablePlainField {
  kind: 'plain';
  name: string;
  operators?: string[];
}

interface IFilterableRelationField {
  kind: 'relation';
  name: string;
  field: string;
  relation: TableMetaProvider<any>;
  relationKey: string;
  relationValue: string;
  operators?: string[];
}

interface IFilterableCustomField {
  kind: 'custom';
  name: string;
  operators: Record<string, Compiler<unknown>>;
}

type IFilterableField = IFilterablePlainField | IFilterableRelationField | IFilterableCustomField;

export interface IFilterInfo {
  model?: TableMetaProvider<any>;
  fields: Map<string, IFilterableField>;
}

function ensureFilterInfo(proto: any): IFilterInfo {
  if (typeof proto[FilterMetadataSymbol] !== 'object') {
    proto[FilterMetadataSymbol] = {
      fields: new Map<string, IFilterableField>(),
    } as IFilterInfo;
  }

  return proto[FilterMetadataSymbol];
}

export const TableMetadataSymbol = Symbol.for('TableMetadata');

type Operations = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'has' | 'like';

export function filterable(Model: TableMetaProvider<any>): ClassDecorator;
export function filterable(target: Object, propertyKey: string | symbol): void;
export function filterable<T extends Record<string, any> = any>(name?: keyof T): PropertyDecorator;
export function filterable<T extends Record<string, any>>(relation: RelationDef<T>, ...whitelist: string[]): PropertyDecorator;
export function filterable<T>(operators: Partial<Record<Operations, Compiler<T>>>): PropertyDecorator;
export function filterable(...args: unknown[]): ClassDecorator | PropertyDecorator | void {
  if (args.length === 1 && args[0][TableMetadataSymbol] != null) {
    return function validator <TFunction extends Function>(target: TFunction): TFunction | void {
      const filterInfo = ensureFilterInfo(target);
      filterInfo.model = args[0] as never;
    }
  }

  let fieldMeta;
  let operators;
  if (args.length > 1 && typeof args[0]?.constructor === 'function' && typeof args[1] === 'string') {
    return validator(...(args as [unknown, string]));
  }

  // eslint-disable-next-line prefer-const
  [fieldMeta, ...operators] = args;
  return validator;

  function validator(target: Object, key: string | symbol): void {
    const filterInfo = ensureFilterInfo(target.constructor);
    const {fields} = filterInfo;

    if (fieldMeta == null || typeof fieldMeta === 'string') {
      fields.set(key.toString(), {
        kind: 'plain',
        name: fieldMeta ?? key.toString(),
      })
    } else if (typeof fieldMeta.match === 'string') {
      const {match: field, table: relation, key: relationKey, value: relationValue} = fieldMeta;
      fields.set(key.toString(), {
        kind: 'relation',
        name: key.toString(),
        field,
        relation,
        relationValue,
        relationKey,
        operators,
      })
    } else {
      fields.set(key.toString(), {
        kind: 'custom',
        name: key.toString(),
        operators: fieldMeta,
      })
    }
  }
}
