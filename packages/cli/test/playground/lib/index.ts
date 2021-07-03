import * as cdk from "@aws-cdk/core";
import { MainStack as ApiStack } from "./api-stack";
import { MainStack as ApolloStack } from "./apollo-api-stack";
import { MainStack as AnotherStack } from "./cron-stack";
import { MainStack as BucketStack } from "./bucket-stack";
//import { MainStack as AnotherStack } from "./table-stack";
//import { MainStack as AnotherStack } from "./table-to-kinesis-stack";
import { MainStack as TopicStack } from "./topic-stack";
//import { MainStack as AnotherStack } from "./topic-to-queue-stack";
import { MainStack as AppsyncStack } from "./app-sync-api-stack";
//import { MainStack as AnotherStack } from "./api-with-lambda-authorizer";
import { MainStack as WebsocketStack } from "./websocket-api-stack";
import { MainStack as StreamStack } from "./kinesis-stream";
import { MainStack as ApiV1Stack } from "./apiv1-stack";
//import { MainStack as AnotherStack } from "./step-functions-stack";
import { MainStack as SiteStack } from "./static-site-stack";
import * as sst from "@serverless-stack/resources";

export default function main(app: sst.App): void {
  new ApiStack(app, "api");
  new ApiV1Stack(app, "apiv1");
  new ApolloStack(app, "apollo");
  new AppsyncStack(app, "appsync");
  new BucketStack(app, "bucket");
  new WebsocketStack(app, "websocket");
  new AnotherStack(app, "another");
  new TopicStack(app, "topic");
  new StreamStack(app, "stream");
  new SiteStack(app, "site");
}

export function debugStack(
  app: cdk.App,
  stack: cdk.Stack,
  props: sst.DebugStackProps
): void {
  cdk.Tags.of(app).add("stage-region", `${props.stage}-${stack.region}`);
}
