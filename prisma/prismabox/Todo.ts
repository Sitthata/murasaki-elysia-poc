import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TodoPlain = t.Object(
  {
    id: t.Integer(),
    text: t.String(),
    completed: t.Boolean(),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const TodoRelations = t.Object({}, { additionalProperties: false });

export const TodoPlainInputCreate = t.Object(
  { text: t.String(), completed: t.Optional(t.Boolean()) },
  { additionalProperties: false },
);

export const TodoPlainInputUpdate = t.Object(
  { text: t.Optional(t.String()), completed: t.Optional(t.Boolean()) },
  { additionalProperties: false },
);

export const TodoRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const TodoRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const TodoWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          text: t.String(),
          completed: t.Boolean(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Todo" },
  ),
);

export const TodoWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object({ id: t.Integer() }, { additionalProperties: false }),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.Integer() })], {
          additionalProperties: false,
        }),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              text: t.String(),
              completed: t.Boolean(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Todo" },
);

export const TodoSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      text: t.Boolean(),
      completed: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TodoInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const TodoOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      text: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      completed: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Todo = t.Composite([TodoPlain, TodoRelations], {
  additionalProperties: false,
});

export const TodoInputCreate = t.Composite(
  [TodoPlainInputCreate, TodoRelationsInputCreate],
  { additionalProperties: false },
);

export const TodoInputUpdate = t.Composite(
  [TodoPlainInputUpdate, TodoRelationsInputUpdate],
  { additionalProperties: false },
);
