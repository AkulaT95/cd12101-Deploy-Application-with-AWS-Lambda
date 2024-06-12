import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
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
    console.log('Getting todos by userId')

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

}
