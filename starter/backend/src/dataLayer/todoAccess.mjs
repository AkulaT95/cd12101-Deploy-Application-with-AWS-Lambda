import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import AWSXRay from 'aws-xray-sdk-core'

export class TodoAccess {
  constructor(
    documentClient = AWSXRay.captureAWSv3Client(new DynamoDB()),
    todosTable = process.env.TODOS_TABLE,
    userIdIndex = process.env.USER_ID_INDEX
  ) {
    this.documentClient = documentClient
    this.todosTable = todosTable
    this.userIdIndex = userIdIndex
    this.dynamoDbClient = DynamoDBDocument.from(this.documentClient)
  }

  async getTodosByUserId(userId) {
    console.log(`Getting todos with userId ${userId}`)

    const params = {
      TableName: this.todosTable,
      IndexName: this.userIdIndex,
      KeyConditionExpression: '#hashKey = :value',
      ExpressionAttributeNames: {
        '#hashKey': 'userId'
      },
      ExpressionAttributeValues: {
        ':value': userId
      }
    }

    const result = await this.dynamoDbClient.query(params)

    return result.Items
  }

  async createTodo(todo) {
    console.log(`Creating a todo with todoId ${todo.todoId}`)

    await this.dynamoDbClient.put({
      TableName: this.todosTable,
      Item: todo
    })

    return todo
  }

  async updateTodo(updateObj, todoId, userId) {
    console.log(`Updating a todo with todoId ${todoId}`)

    const { name, dueDate, done } = updateObj
    const params = {
      TableName: this.todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      },
      UpdateExpression:
        'set #name = :nameValue, #dueDate = :dueDateValue, #done = :doneValue',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#dueDate': 'dueDate',
        '#done': 'done'
      },
      ExpressionAttributeValues: {
        ':nameValue': name,
        ':dueDateValue': dueDate,
        ':doneValue': done
      },
      ReturnValues: 'UPDATED_NEW'
    }
    await this.dynamoDbClient.update(params)
  }

  async deleteTodo(todoId, userId) {
    console.log(`Deleting a todo with todoId ${todoId}`)

    await this.dynamoDbClient.delete({
      TableName: this.todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      }
    })
  }
}