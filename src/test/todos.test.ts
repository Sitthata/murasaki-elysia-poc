import { beforeEach, describe, expect, it } from "bun:test";

describe("TODO API", () => {
  const BASE_URL = "http://localhost:8080/api";
  it("should return status 200 when get todos", async () => {
    const response = await fetch(`${BASE_URL}/todos`);
    expect(response.status).toBe(200);
  })
  it("should return a list of todos", async () => {
    const response = await fetch(`${BASE_URL}/todos`);
    const todos = await response.json();
    expect(Array.isArray(todos)).toBe(true);
  })
  it("should return 201 status when successfully created todo", async () => {
    const newTodo = { text: "New Todo", completed: false };
    const response = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        body: JSON.stringify(newTodo),
        headers: {
            "Content-Type": "application/json"
        }
    })
    expect(response.status).toBe(201);
  })
})