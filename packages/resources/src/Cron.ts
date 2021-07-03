import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as events from "@aws-cdk/aws-events";
import * as eventsTargets from "@aws-cdk/aws-events-targets";

import { App } from "./App";
import { Stack } from "./Stack";
import { ISstConstruct, ISstConstructInfo } from "./Construct";
import { Function as Func, FunctionDefinition } from "./Function";
import { Permissions } from "./util/permission";

export interface CronProps {
  readonly job: FunctionDefinition;
  readonly schedule?: string | cdk.Duration | events.CronOptions;
  readonly eventsRule?: events.Rule;
}

export class Cron extends cdk.Construct implements ISstConstruct {
  public readonly eventsRule: events.Rule;
  public readonly jobFunction: Func;

  constructor(scope: cdk.Construct, id: string, props: CronProps) {
    super(scope, id);

    const root = scope.node.root as App;
    const {
      // Topic props
      schedule,
      eventsRule,
      // Function props
      job,
    } = props;

    // Validate input
    if (eventsRule !== undefined && schedule !== undefined) {
      throw new Error(`Cannot define both schedule and eventsRule`);
    }

    ///////////////////////////
    // Create Rule
    ///////////////////////////

    if (!eventsRule) {
      if (!schedule) {
        throw new Error(`No schedule defined for the "${id}" Cron`);
      }

      // Configure Schedule
      let propSchedule: events.Schedule;
      if (
        typeof schedule === "string" &&
        (schedule.startsWith("rate(") || schedule.startsWith("cron("))
      ) {
        propSchedule = events.Schedule.expression(schedule);
      } else if (schedule instanceof cdk.Duration) {
        propSchedule = events.Schedule.rate(schedule);
      } else {
        propSchedule = events.Schedule.cron(schedule as events.CronOptions);
      }

      this.eventsRule = new events.Rule(this, "Rule", {
        schedule: propSchedule,
      });
    } else {
      this.eventsRule = eventsRule;
    }

    ///////////////////////////
    // Create Targets
    ///////////////////////////

    if (!job) {
      throw new Error(`No job defined for the "${id}" Cron`);
    }
    this.jobFunction = Func.fromDefinition(this, "Job", job);
    this.eventsRule.addTarget(
      new eventsTargets.LambdaFunction(this.jobFunction)
    );

    ///////////////////
    // Register Construct
    ///////////////////
    root.registerConstruct(this);
  }

  public attachPermissions(permissions: Permissions): void {
    this.jobFunction.attachPermissions(permissions);
  }

  public getConstructInfo(): ISstConstructInfo {
    const cfn = this.jobFunction.node.defaultChild as lambda.CfnFunction;
    return {
      functionLogicalId: Stack.of(this).getLogicalId(cfn),
      functionStack: Stack.of(this.jobFunction).node.id,
    };
  }
}
