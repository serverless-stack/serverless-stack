import * as sst from "@serverless-stack/resources";

class MySampleStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    new sst.Function(this, "MyLambda1", {
      bundle: true,
      srcPath: "service",
      handler: "lambda.handler",
    });
    new sst.Function(this, "MyLambda2", {
      bundle: true,
      srcPath: "service",
      handler: "src/srcLambda.handler",
    });
  }
}

export default function main(app) {
  new MySampleStack(app, "sample");
}
