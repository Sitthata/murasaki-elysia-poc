import Elysia, { t } from "elysia";

export const routes = new Elysia({ prefix: "/api" })
  .get('/todos', () => {
    return [{ id: 1, text: "Learn Elysia", completed: false }];
  })
  .post('/todos', ({ body, set }) => {
    set.status = 201;
    return { id: Date.now(), ...body };
  }, {
    body: t.Object({
      text: t.String(),
      completed: t.Boolean()
    })
  })

