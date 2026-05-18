#!/bin/bash
set -e
CLI="aws --endpoint-url=http://localhost:4566 --region us-east-1"

for Q in execution-commands execution-replies execution-events stock-commands stock-replies; do
  $CLI sqs create-queue --queue-name "garage-$Q"
done

$CLI dynamodb create-table --table-name RepairLog \
  --attribute-definitions AttributeName=serviceOrderId,AttributeType=S AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=serviceOrderId,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

$CLI dynamodb create-table --table-name ExecutionQueue \
  --attribute-definitions AttributeName=serviceOrderId,AttributeType=S \
  --key-schema AttributeName=serviceOrderId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

$CLI dynamodb create-table --table-name ServiceOrderExecution \
  --attribute-definitions AttributeName=serviceOrderId,AttributeType=S \
  --key-schema AttributeName=serviceOrderId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
