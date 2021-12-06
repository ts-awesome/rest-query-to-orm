import {dbField, dbTable} from "../../ts-orm/src";
import {QueryParserMiddlewareFor} from "../src";
import {exists, IBuildableQuery, IOperandable, Select, TableMetaProvider} from "@ts-awesome/orm";
import {CONTAINS_OP, EQ_OP, NEQ_OP} from "@ts-awesome/simple-query";
import {filterable} from "../src/decorators";


@dbTable('table')
class DataModel {
  @dbField({primaryKey: true})
  public id!: number;

  @dbField
  public name!: string;

  @dbField
  public value!: string;

  @dbField
  public typeId!: number;
}

@dbTable('type')
class TypeModel {
  @dbField({primaryKey: true})
  public id!: number;

  @dbField
  public uid!: string;

  @dbField
  public name!: string;
}

@filterable(DataModel)
class FilterModel {
  @filterable
  public name?: string;

  @filterable
  public value?: string;

  @filterable<DataModel>({
    match: 'typeId',
    table: TypeModel,
    key: 'id',
    value: 'uid',
  }, EQ_OP, NEQ_OP)
  public type?: string;

  @filterable({
    [CONTAINS_OP]: (id: IOperandable<number>, op, value: string) =>
      exists(Select(TagModel)
        .where(({uid}) => uid.eq(value))
        .join(DataTagModel, (a, b) => a.id.eq(id)))
  })
  public tags?: string[];
}

const M = QueryParserMiddlewareFor(FilterModel);
const m = new M();

m.handle(null as never, null as never).catch(console.error);
