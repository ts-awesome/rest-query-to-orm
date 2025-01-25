# @ts-awesome/rest-query-to-orm

TypeScript simple-query to ORM compiler middleware

It does what its name says.

## Base use

```ts
import {ISimpleQuery, IOrderBy} from "@ts-awesome/rest-query";
import {compileWhereFor} from "@ts-awesome/rest-query-to-orm";
import {filterable} from "./decorators";
import {IEntityService} from "@ts-awesome/orm";
import {compileOrderFor} from "./compiler";

@dbTable('some_table')
class Model {
  @dbField a: number;
  @dbField b: string;
}

const query: ISimpleQuery = {
  $and: [
    {a: 5},
    {$neq: {b: "test"}}
  ]
};

const orderBy: IOrderBy[] = [
  {a: 'DESC'}
];

// prepare filter
const whereClause = compileWhereFor(Model, query);
// prepare sorter
const orderByClause = compileOrderFor(Mode, orderBy);

const compiled = Select(Model)
  .where(whereClause)
  .orderBy(orderByClause);

```

## Use with @ts-awesome/rest

```ts
import {Route, httpGet, queryParam} from "@ts-awesome/rest";
import {WhereBuilder, OrderBuilder} from "@ts-awesome/orm";
import {QueryParserMiddlewareFor} from "@ts-awesome/rest-query-to-orm";
import {GetListQueryInput} from "./query-parser-middleware";

@httpGet('/test', QueryParserMiddlewareFor(Model))
export class TestRoute extends Route {
  @inject(GetListQuerySymbol)
  protected model!: GetListQueryInput<Model>

  @inject(SomeEntityServiceSymbol)
  protected entityService!: ISomeEntityService;

  async handle() {
    const baseQuery = this.entityService
      .select()
      // ensure visibility rules
      .where(x => x.ownerId.eq(this.autheUser.id));

    if (this.model.query) {
      baseQuery.where(this.model.query);
    }

    if (this.model.countOnly) {
      // return count
      return this.jsonAsync(baseQuery.count());
    }

    // include default order to ensure stable default ordering
    baseQuery.orderBy(model.orderBy ?? (['id'] as never))
    baseQuery.offset(model.offset ?? 0);
    baseQuery.limit(model.limit ?? 100);

    const results: readonly Model[] = await baseQuery.fetch();
  }
}
```

Use `DescribeQueryParams` a helper function to provide useful description via OpenApi schemas

## Filterable model

There are cases when raw DB model has sensitive fields that should not be exposed 
for filtering and sorting. In such cases filterable model comes to resque

```ts
import {filterable} from "@ts-awesome/rest-query-to-orm";

// works over DB model
@filterable(Model)
class FilterableModel {
  // plain filterable field, should match field in DB Model
  @filterable a?: number;
  @filterable('b') alias?: string;
  
  // foreign keys
  @filterable<Model>({
    match: 'b', // field in DB model,
    table: OtherModel,
    key: 'id', // field to match to
    value: 'name', // field to filter on 
  })
  author?: string;
}
```

### Custom logic for filtering

`@filterable` also support a fully custom queries for each operation 
(`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `contains`, `like`)

```ts
import {exists, Select} from "@ts-awesome/orm";
import {filterable, Compiler} from "@ts-awesome/rest-query-to-orm";

const filterBuilder: Compiler<unknown> = (primary, op, value) => {
  return exists(Select(OtherModel).where(({authorId, name}) => and(
    authorId.eq(primary),
    name[op](value),
  )));
}

@filterable(Model)
class FilterableModel {
  @filterable<Model>({
    eq: filterBuilder,
    neq: filterBuilder,
  })
  authorName?: string;
}
```

# License
May be freely distributed under the [MIT license](https://opensource.org/licenses/MIT).

Copyright (c) 2022 Volodymyr Iatsyshyn and other contributors
