import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import AddReviewWorkflow from "../workflows/add_review.ts";

const addReviewTrigger: Trigger<typeof AddReviewWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Request PR review",
  description: "Track a GitHub PR and ping reviewers",
  workflow: `#/workflows/${AddReviewWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default addReviewTrigger;
