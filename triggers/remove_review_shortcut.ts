import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import RemoveReviewWorkflow from "../workflows/remove_review.ts";

const removeReviewTrigger: Trigger<typeof RemoveReviewWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Remove PR review request",
  description: "Stop tracking a PR (owner only)",
  workflow: `#/workflows/${RemoveReviewWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default removeReviewTrigger;
