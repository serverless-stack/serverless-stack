import "@aws-cdk/assert/jest";
import { ABSENT } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";
import { App, Stack, Queue, Function } from "../src";

const lambdaDefaultPolicy = {
  Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
  Effect: "Allow",
  Resource: "*",
};
const queueDefaultPolicy = {
  Action: [
    "sqs:ReceiveMessage",
    "sqs:ChangeMessageVisibility",
    "sqs:GetQueueUrl",
    "sqs:DeleteMessage",
    "sqs:GetQueueAttributes",
  ],
  Effect: "Allow",
  Resource: {
    "Fn::GetAtt": ["Queue381943A6", "Arn"],
  },
};

/////////////////////////////
// Test Constructor
/////////////////////////////

test("constructor: sqsQueue is undefined", async () => {
  const stack = new Stack(new App(), "stack");
  new Queue(stack, "Queue");
  expect(stack).toCountResources("AWS::SQS::Queue", 1);
  expect(stack).toCountResources("AWS::Lambda::EventSourceMapping", 0);
});

test("constructor: sqsQueue is imported", async () => {
  const app = new App();
  app.registerConstruct = jest.fn();
  const stack = new Stack(app, "stack");
  const queue = new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
    sqsQueue: sqs.Queue.fromQueueArn(
      stack,
      "Q",
      "arn:aws:sqs:us-east-1:123:queue"
    ),
  });
  expect(stack).toCountResources("AWS::Lambda::Function", 1);
  expect(stack).toHaveResource("AWS::Lambda::Function", {
    Handler: "lambda.handler",
  });
  expect(stack).toCountResources("AWS::SQS::Queue", 0);
  expect(stack).toCountResources("AWS::Lambda::EventSourceMapping", 1);
  expect(stack).toHaveResource("AWS::Lambda::EventSourceMapping", {
    BatchSize: ABSENT,
  });

  // test construct info
  expect(app.registerConstruct).toHaveBeenCalledTimes(1);
  expect(queue.getConstructInfo()).toStrictEqual({
    queueUrl: "https://sqs.us-east-1.amazonaws.com/123/queue",
  });
});

test("constructor: sqsQueue is props", async () => {
  const app = new App();
  app.registerConstruct = jest.fn();
  const stack = new Stack(app, "stack");
  const queue = new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
    sqsQueue: {
      queueName: "my-queue",
      visibilityTimeout: cdk.Duration.seconds(5),
    },
  });
  expect(stack).toCountResources("AWS::Lambda::Function", 1);
  expect(stack).toHaveResource("AWS::Lambda::Function", {
    Handler: "lambda.handler",
  });
  expect(stack).toCountResources("AWS::SQS::Queue", 1);
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    QueueName: "my-queue",
    VisibilityTimeout: 5,
  });
  expect(stack).toCountResources("AWS::Lambda::EventSourceMapping", 1);

  // test construct info
  expect(app.registerConstruct).toHaveBeenCalledTimes(1);
  expect(queue.getConstructInfo()).toStrictEqual({
    queueLogicalId: "Queue381943A6",
  });
});

test("consumer-string", async () => {
  const stack = new Stack(new App(), "stack");
  new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
  });
  expect(stack).toCountResources("AWS::Lambda::Function", 1);
  expect(stack).toHaveResource("AWS::Lambda::Function", {
    Handler: "lambda.handler",
  });
  expect(stack).toCountResources("AWS::SQS::Queue", 1);
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    QueueName: "dev-my-app-Queue",
  });
});

test("consumer-Function", async () => {
  const stack = new Stack(new App(), "stack");
  const f = new Function(stack, "Function", { handler: "test/lambda.handler" });
  new Queue(stack, "Queue", {
    consumer: f,
  });
  expect(stack).toHaveResource("AWS::Lambda::Function", {
    Handler: "lambda.handler",
  });
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    QueueName: "dev-my-app-Queue",
  });
});

test("consumer-FunctionProps", async () => {
  const stack = new Stack(new App(), "stack");
  new Queue(stack, "Queue", {
    consumer: { handler: "test/lambda.handler" },
  });
  expect(stack).toHaveResource("AWS::Lambda::Function", {
    Handler: "lambda.handler",
  });
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    QueueName: "dev-my-app-Queue",
  });
});

test("consumer-props", async () => {
  const stack = new Stack(new App(), "stack");
  new Queue(stack, "Queue", {
    consumer: {
      function: "test/lambda.handler",
      consumerProps: {
        batchSize: 5,
      },
    },
  });
  expect(stack).toHaveResource("AWS::Lambda::Function", {
    Handler: "lambda.handler",
  });
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    QueueName: "dev-my-app-Queue",
  });
  expect(stack).toHaveResource("AWS::Lambda::EventSourceMapping", {
    BatchSize: 5,
  });
});

test("consumer-undefined", async () => {
  const stack = new Stack(new App(), "stack");
  new Queue(stack, "Queue", {});
  expect(stack).toCountResources("AWS::SQS::Queue", 1);
  expect(stack).toCountResources("AWS::Lambda::EventSourceMapping", 0);
});

/////////////////////////////
// Test Constructor for Local Debug
/////////////////////////////

test("constructor: debugIncreaseTimeout true: visibilityTimeout not set", async () => {
  const app = new App({
    debugEndpoint: "placeholder",
    debugBucketArn: "placeholder",
    debugBucketName: "placeholder",
    debugIncreaseTimeout: true,
  });
  const stack = new Stack(app, "stack");
  new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
  });
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    VisibilityTimeout: 900,
  });
});

test("constructor: debugIncreaseTimeout true: visibilityTimeout set to < 900", async () => {
  const app = new App({
    debugEndpoint: "placeholder",
    debugBucketArn: "placeholder",
    debugBucketName: "placeholder",
    debugIncreaseTimeout: true,
  });
  const stack = new Stack(app, "stack");
  new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
    sqsQueue: {
      visibilityTimeout: cdk.Duration.seconds(100),
    },
  });
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    VisibilityTimeout: 900,
  });
});

test("constructor: debugIncreaseTimeout true: visibilityTimeout set to > 900", async () => {
  const app = new App({
    debugEndpoint: "placeholder",
    debugBucketArn: "placeholder",
    debugBucketName: "placeholder",
    debugIncreaseTimeout: true,
  });
  const stack = new Stack(app, "stack");
  new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
    sqsQueue: {
      visibilityTimeout: cdk.Duration.seconds(1000),
    },
  });
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    VisibilityTimeout: 1000,
  });
});

test("constructor: debugIncreaseTimeout false: visibilityTimeout not set", async () => {
  const app = new App({
    debugEndpoint: "placeholder",
    debugBucketArn: "placeholder",
    debugBucketName: "placeholder",
    debugIncreaseTimeout: false,
  });
  const stack = new Stack(app, "stack");
  new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
  });
  expect(stack).toHaveResource("AWS::SQS::Queue", {
    VisibilityTimeout: ABSENT,
  });
});

/////////////////////////////
// Test Methods
/////////////////////////////

test("addConsumer", async () => {
  const stack = new Stack(new App(), "stack");
  const queue = new Queue(stack, "Queue");
  expect(stack).toCountResources("AWS::Lambda::EventSourceMapping", 0);
  queue.addConsumer(stack, "test/lambda.handler");
  expect(stack).toCountResources("AWS::Lambda::EventSourceMapping", 1);
  expect(() => {
    queue.addConsumer(stack, "test/lambda.handler");
  }).toThrow(/Cannot configure more than 1 consumer for a Queue/);
});

test("attachPermissions", async () => {
  const stack = new Stack(new App(), "stack");
  const queue = new Queue(stack, "Queue", {
    consumer: "test/lambda.handler",
  });
  queue.attachPermissions(["s3"]);
  expect(stack).toHaveResource("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: [
        lambdaDefaultPolicy,
        queueDefaultPolicy,
        { Action: "s3:*", Effect: "Allow", Resource: "*" },
      ],
      Version: "2012-10-17",
    },
    PolicyName: "QueueConsumerServiceRoleDefaultPolicy8A09B9BC",
  });
});

test("attachPermissions-after-addConsumer", async () => {
  const stack = new Stack(new App(), "stack");
  const queue = new Queue(stack, "Queue");
  queue.attachPermissions(["s3"]);
  queue.addConsumer(stack, "test/lambda.handler");
  expect(stack).toHaveResource("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: [
        lambdaDefaultPolicy,
        queueDefaultPolicy,
        { Action: "s3:*", Effect: "Allow", Resource: "*" },
      ],
      Version: "2012-10-17",
    },
    PolicyName: "ConsumerServiceRoleDefaultPolicy0717ECC4",
  });
});
