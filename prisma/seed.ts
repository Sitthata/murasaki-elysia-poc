import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTodosIfNotExist() {
  const todos = [
    { id: 1, text: "Learn Elysia", completed: false },
    { id: 2, text: "Build a REST API", completed: false },
    { id: 3, text: "Integrate with Prisma", completed: false },
  ];

  console.log("Starting to seed todos...");

  for (const todo of todos) {
    try {
      const result = await prisma.todo.upsert({
        where: { id: todo.id },
        update: {},
        create: todo,
      });
      console.log(`Created/Updated todo: ${result.text}`);
    } catch (error) {
      console.error(`Error creating todo ${todo.id}:`, error);
    }
  }

  console.log("Seeding completed!");
}

async function main() {
  await createTodosIfNotExist();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
