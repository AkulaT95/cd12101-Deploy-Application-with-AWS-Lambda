import { TodoAccess } from '../dataLayer/todoAccess.mjs'
import { getUserId } from '../lambda/utils.mjs'

const todoAccess = new TodoAccess()

export async function getTodos(event) {
  const userId = getUserId(event);
  return todoAccess.getTodosByUserId(userId)
}