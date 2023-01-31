import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  UpdateExpression,
  AttributeValue,
  ExpressionAttributes,
} from "@aws/dynamodb-expressions";

import { StatementStorage, StoredStatement } from "../../schema/model";
import {
  makeKey,
  marshaller,
  setFields,
  TableName,
  withAttributes,
} from "./utils";
import DataLoader from "dataloader";

export function makeDelegateStatementKey(address: string) {
  return makeKey({
    PartitionKey: `DelegateStatement`,
    SortKey: address,
  });
}

export function makeDynamoStatementStorage(client: DynamoDB): StatementStorage {
  const getStatementDataloader = new DataLoader<string, StoredStatement | null>(
    async (keys) => {
      const results = await client.batchGetItem({
        RequestItems: {
          [TableName]: {
            Keys: keys.map((address) =>
              makeDelegateStatementKey(address)
            ) as any,
          },
        },
      });

      return Object.values(results.Responses![TableName]).map(
        (value) => marshaller.unmarshallItem(value) as StoredStatement | null
      );
    },
    { batch: true, maxBatchSize: 100 }
  );

  return {
    async getStatement(address: string): Promise<StoredStatement | null> {
      return await getStatementDataloader.load(address.toLowerCase());
    },
    async addStatement(statement: StoredStatement): Promise<void> {
      const marshalledStatement = marshaller.marshallItem({
        ...statement,
      });

      await client.transactWriteItems({
        TransactItems: [
          {
            Put: {
              TableName,
              Item: {
                ...makeDelegateStatementKey(statement.address.toLowerCase()),
                ...marshalledStatement,
              } as any,
            },
          },
          {
            Update: {
              Key: makeKey({
                PartitionKey: `MergedDelegate`,
                SortKey: statement.address.toLowerCase(),
              }) as any,
              TableName,

              ...(() => {
                const attributes = new ExpressionAttributes();

                const updateExpression = new UpdateExpression();
                updateExpression.set(
                  "statement",
                  new AttributeValue(marshalledStatement)
                );

                setFields(updateExpression, {
                  address: statement.address.toLowerCase(),
                });

                return {
                  UpdateExpression: updateExpression.serialize(attributes),
                  ...withAttributes(attributes),
                };
              })(),
            },
          },
        ],
      });
    },
  };
}
