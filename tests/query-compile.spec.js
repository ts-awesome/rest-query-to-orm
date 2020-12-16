const {compileWhereFor} = require('../dist/compiler');
const {AND_OP, OR_OP, NOT_OP, REF_OP, EQ_OP, NEQ_OP, GT_OP, GTE_OP, LT_OP, LTE_OP, REGEX_OP, IN_OP, LIKE_OP} = require('@ts-awesome/simple-query');

describe('query compiler', () => {

  class Model {
  }

  function operands(field) {
    const fns = {
      eq(x) { return `\`${field}\`=${x}` },
      neq(x) { return `\`${field}\`!=${x}` },
      gt(x) { return `\`${field}\`>${x}` },
      gte(x) { return `\`${field}\`>=${x}` },
      lt(x) { return `\`${field}\`<${x}` },
      lte(x) { return `\`${field}\`<=${x}` },
      like(x) { return `\`${field}\`~${JSON.stringify(x)}`},
      in(x) { return `\`${field}\`IN${JSON.stringify(x)}`},
    }

    const result = new String('`' + field + '`');
    Object.entries(fns).forEach(([key, value]) => {
      Object.defineProperty(result, key, {
        value,
        enumerable: false,
      });
    });

    return result;
  }

  function operandable(...keys) {
    return Object.fromEntries(keys.map(field => ([
      field,
      operands(field),
    ])));
  }

  it('simple', async () => {
    const input = {
      'a': 1
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a'));

    expect(result).toStrictEqual("`a`=1");
  })

  it('basic and', async () => {
    const input = {
      'a': 1,
      'b': 2,
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual({
      _operands: [
        "`a`=1",
        "`b`=2",
      ],
      _operator: 'AND'
    });
  });

  it('explicit and', async () => {
    const input = {
      [AND_OP]: {
        'a': 1,
        'b': 2,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual({
      _operands: [
        "`a`=1",
        "`b`=2",
      ],
      _operator: 'AND'
    });
  });

  it('explicit or', async () => {
    const input = {
      [OR_OP]: {
        'a': 1,
        'b': 2,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual({
      _operands: [
        "`a`=1",
        "`b`=2",
      ],
      _operator: 'OR'
    });
  });

  it('explicit not', async () => {
    const input = {
      [NOT_OP]: {
        'a': 1,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual({
      _operands: [
        "`a`=1",
      ],
      _operator: 'NOT'
    });
  });

  it('explicit eq', async () => {
    const input = {
      [EQ_OP]: {
        'a': 1,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`=1");
  });

  it('explicit neq', async () => {
    const input = {
      [NEQ_OP]: {
        'a': 1,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`!=1");
  });

  it('explicit gt', async () => {
    const input = {
      [GT_OP]: {
        'a': 1,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`>1");
  });

  it('explicit gte', async () => {
    const input = {
      [GTE_OP]: {
        'a': 1,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`>=1");
  });

  it('explicit lt', async () => {
    const input = {
      [LT_OP]: {
        'a': 1,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`<1");
  });

  it('explicit lte', async () => {
    const input = {
      [LTE_OP]: {
        'a': 1,
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`<=1");
  });

  it('explicit lte', async () => {
    const input = {
      [LTE_OP]: {
        'a': {[REF_OP]: 'b'},
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`<=`b`");
  });

  it('explicit like', async () => {
    const input = {
      [LIKE_OP]: {
        'a': 'a%',
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`~\"a%\"");
  });

  it('explicit in', async () => {
    const input = {
      [IN_OP]: {
        'a': [1,2],
      }
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( "`a`IN[1,2]");
  });

  it('expression', async () => {
    const input = {
      [AND_OP]: [
        {[IN_OP]: {
          'a': [1,2],
        }},
        {[OR_OP]: [
            {[NEQ_OP]: {
              'a': 2
            }}   ,
            {[GTE_OP]: {
              'a': 6
            }}
        ]},
        {[LIKE_OP]: {
          'b': 'test%'
        }}
      ]
    };

    const fn = compileWhereFor(Model, input);

    const result = fn(operandable('a', 'b'));

    expect(result).toStrictEqual( {
      "_operands": [
        "`a`IN[1,2]",
        {
          "_operands": [
            "`a`!=2",
            "`a`>=6"
          ],
          "_operator": "OR"
        },
        '`b`~"test%"',
      ],
      "_operator": "AND"
    });
  });
})
