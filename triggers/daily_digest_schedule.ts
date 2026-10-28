import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ScheduledTrigger } from "deno-slack-api/typed-method-types/workflows/triggers/scheduled.ts";
import DigestWorkflow from "../workflows/digest.ts";

const dailyDigestSchedule: ScheduledTrigger<typeof DigestWorkflow.definition> =
  {
    name: "Daily PR review digest",
    type: TriggerTypes.Scheduled,
    workflow: `#/workflows/${DigestWorkflow.definition.callback_id}`,
    inputs: {},
    schedule: {
      start_time: "2026-10-28T13:00:00Z",
      frequency: { type: "daily", repeats_every: 1 },
    },
  };

export default dailyDigestSchedule;
