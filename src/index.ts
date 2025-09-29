import { Elysia } from "elysia";
import { routes } from "./routes";
import { PrismaClient } from "../generated/prisma";

const PORTNUMBER = 8080;

export const prisma = new PrismaClient();
const app = new Elysia().use(routes).listen(PORTNUMBER);

console.log(`Server running at http://localhost:${PORTNUMBER}`);

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
