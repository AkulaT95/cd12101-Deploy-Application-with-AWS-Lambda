import { TodoAccess } from '../dataLayer/todoAccess.mjs'
import { getUserId } from '../lambda/utils.mjs'
import { v4 as uuidv4 } from 'uuid'

const todoAccess = new TodoAccess()

export async function getTodos(event) {
  console.log('Processing event: ', event)
  const userId = getUserId(event)
  return await todoAccess.getTodosByUserId(userId)
}

export async function createTodo(event) {
  console.log('Processing event: ', event)
  const userId = getUserId(event)
  const todoId = uuidv4()
  const parsedBody = JSON.parse(event.body)
  const newItem = {
    todoId,
    userId,
    done: false,
    createdAt: new Date(Date.now()).toISOString(),
    ...parsedBody
  }

  return await todoAccess.createTodo(newItem)
}

export async function updateTodo(event) {
  console.log('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  const parsedBody = JSON.parse(event.body)

  await todoAccess.updateTodo(parsedBody, todoId, userId)
}

export async function deleteTodo(event) {
  console.log('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  await todoAccess.deleteTodo(todoId, userId)
}

export async function generateUploadUrl(event) {
  console.log('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  return await todoAccess.generateUploadUrl(todoId)
}
