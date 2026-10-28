import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import MarkDoneWorkflow from "../workflows/mark_done.ts";

const markDoneTrigger: Trigger<typeof MarkDoneWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Mark PR review done",
  description: "Mark your review of a PR as finished",
  workflow: `#/workflows/${MarkDoneWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default markDoneTrigger;
