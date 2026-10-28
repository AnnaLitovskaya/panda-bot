import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import WatchWorkflow from "../workflows/watch.ts";

const watchTrigger: Trigger<typeof WatchWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Watch or ignore PR",
  description: "Choose whether to get direct messages about a PR",
  workflow: `#/workflows/${WatchWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default watchTrigger;
