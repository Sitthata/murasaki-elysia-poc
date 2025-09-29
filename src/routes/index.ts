import Elysia, { t } from "elysia";
import { prisma } from "src";

export const routes = new Elysia({ prefix: "/api" })
  // .get("/todos", () => {
  //   return [{ id: 1, text: "Learn Elysia", completed: false }];
  // })
  .post(
    "/todo",
    async ({ body, set }) => {
      const newUser = await prisma.todo.create({
        data: body,
      });
      set.status = 201;
      return newUser;
    },
    {
      body: t.Object({
        text: t.String(),
        completed: t.Boolean(),
      }),
    },
  );
