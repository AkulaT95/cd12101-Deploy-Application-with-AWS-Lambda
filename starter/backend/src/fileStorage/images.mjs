import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import AWSXRay from 'aws-xray-sdk-core'

export class ImageAccess {
  constructor(
    documentClient = AWSXRay.captureAWSv3Client(new DynamoDB()),
    s3Client = AWSXRay.captureAWSv3Client(new S3Client()),
    bucketName = process.env.IMAGES_S3_BUCKET,
    urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION),
    todosTable = process.env.TODOS_TABLE
  ) {
    this.s3Client = s3Client
    this.documentClient = documentClient
    this.bucketName = bucketName
    this.urlExpiration = urlExpiration
    this.todosTable = todosTable
    this.dynamoDbClient = DynamoDBDocument.from(this.documentClient)
  }

  async generateUploadUrl(todoId, userId) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: todoId
    })
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.urlExpiration
    })
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`;
    const params = {
      TableName: this.todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      },
      UpdateExpression:
        'set #attachmentUrl = :attachmentUrlValue',
      ExpressionAttributeNames: {
        '#attachmentUrl': 'attachmentUrl'
      },
      ExpressionAttributeValues: {
        ':attachmentUrlValue': attachmentUrl
      }
    }
    await this.dynamoDbClient.update(params)
    return url
  }
}