import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    GetCommand,
    DeleteCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);


const tableName = "todos";

export const handler = async (event, context) => {
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json",
    };

    try {
        const userId = event.requestContext.authorizer.jwt.claims.sub;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        switch (event.routeKey) {
            case "DELETE /todos/{id}":
                await dynamo.send(
                    new DeleteCommand({
                        TableName: tableName,
                        Key: {
                            user_id: userId,
                            id: event.pathParameters.id,
                        },
                        ConditionExpression: "user_id = :user_id",
                        ExpressionAttributeValues: {
                            ":user_id": userId
                        }
                    })
                );
                body = `Deleted item ${event.pathParameters.id}`;
                break;

            case "GET /todos/{id}":
                body = await dynamo.send(
                    new GetCommand({
                        TableName: tableName,
                        Key: {
                            user_id: userId,
                            id: event.pathParameters.id,
                        },
                        ProjectionExpression: "id, task, completed, created_at, modified_at, deleted_at",
                    })
                );
                body = body.Item;
                break;

            case "GET /todos":
                body = await dynamo.send(
                    new ScanCommand({
                        TableName: tableName,
                        FilterExpression: "user_id = :user_id",
                        ExpressionAttributeValues: {
                            ":user_id": userId,
                        },
                        ProjectionExpression: "id, task, completed, created_at, modified_at, deleted_at",
                    })
                );
                body = body.Items;
                break;

            case "POST /todos": {
                let requestJSON = JSON.parse(event.body);


                // Validate UUID (id) format
                let uuid = requestJSON.id;
                if (uuid && !isValidUUID(uuid)) {
                    body = "Invalid UUID format.";
                    statusCode = 400;
                    break;
                }

                // Validate timestamp (created_at) format
                let createdAt = requestJSON.created_at;
                if (createdAt && !isValidTimestamp(createdAt)) {
                    body = "Invalid timestamp format.";
                    statusCode = 400;
                    break;
                }

                // Validate timestamp (modified_at) format
                let modifiedAt = requestJSON.modified_at;
                if (modifiedAt && !isValidTimestamp(modifiedAt)) {
                    body = "Invalid timestamp format.";
                    statusCode = 400;
                    break;
                }

                // Validate timestamp (deleted_at) format
                let deletedAt = requestJSON.deleted_at;
                if (deletedAt && !isValidTimestamp(deletedAt)) {
                    body = "Invalid timestamp format.";
                    statusCode = 400;
                    break;
                }

                // If no valid id or timestamp, generate them
                uuid = uuid || crypto.randomUUID();
                createdAt = createdAt || new Date().toISOString();
                modifiedAt = modifiedAt || new Date().toISOString();
                deletedAt = deletedAt || null;

                await dynamo.send(
                    new PutCommand({
                        TableName: tableName,
                        Item: {
                            user_id: userId,
                            id: uuid,
                            task: requestJSON.task,
                            completed: false,
                            created_at: createdAt,
                            modified_at: modifiedAt,
                            deleted_at: deletedAt
                        },
                    })
                );
                body = `Post item ${uuid}`;
                break;
            }

            case "PUT /todos/{id}": {
                const requestJSON = JSON.parse(event.body);
                const todoId = event.pathParameters.id;

                // Create update expressions dynamically based on the fields in the request body
                const updateExpression = [];
                const expressionAttributeValues = {};

                if (requestJSON.task) {
                    updateExpression.push("task = :task");
                    expressionAttributeValues[":task"] = requestJSON.task;
                }
                if (typeof requestJSON.completed !== "undefined") {
                    updateExpression.push("completed = :completed");
                    expressionAttributeValues[":completed"] = requestJSON.completed;
                }
                if (requestJSON.modified_at) {
                    updateExpression.push("modified_at = :modified_at");
                    expressionAttributeValues[":modified_at"] = requestJSON.modified_at;
                }
                if (requestJSON.deleted_at) {
                    updateExpression.push("deleted_at = :deleted_at");
                    expressionAttributeValues[":deleted_at"] = requestJSON.deleted_at;
                }

                // If no fields are provided, return an error
                if (updateExpression.length === 0) {
                    throw new Error("No fields to update.");
                }

                // Join the update expressions with commas
                const updateExpressionString = "SET " + updateExpression.join(", ");

                // Update the item in DynamoDB
                await dynamo.send(
                    new UpdateCommand({
                        TableName: tableName,
                        Key: {
                            user_id: userId,
                            id: todoId,
                        },
                        UpdateExpression: updateExpressionString,
                        ConditionExpression: "user_id = :user_id",
                        ExpressionAttributeValues: {
                            ...expressionAttributeValues,
                            ":user_id": userId,
                        },
                        ReturnValues: "ALL_NEW",
                    })
                );

                body = `Updated todo item ${todoId}`;
                break;
            }

            default:
                throw new Error(`Unsupported route: "${event.routeKey}"`);
        }
    } catch (err) {
        statusCode = 400;
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};

// Helper function to validate UUID
function isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

// Helper function to validate ISO 8601 timestamp format
function isValidTimestamp(timestamp) {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
    return iso8601Regex.test(timestamp);
}
