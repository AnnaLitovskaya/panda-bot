import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { RemoveReviewDefinition } from "../functions/remove_review.ts";

const RemoveReviewWorkflow = DefineWorkflow({
  callback_id: "remove_review_workflow",
  title: "Remove PR review request",
  description: "Stop tracking a PR (owner only)",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = RemoveReviewWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "Remove PR review",
  interactivity: RemoveReviewWorkflow.inputs.interactivity,
  submit_label: "Remove",
  fields: {
    elements: [{
      name: "pr_url",
      title: "GitHub PR URL",
      type: Schema.types.string,
    }],
    required: ["pr_url"],
  },
});

RemoveReviewWorkflow.addStep(RemoveReviewDefinition, {
  pr_url: form.outputs.fields.pr_url,
  user: RemoveReviewWorkflow.inputs.user,
});

export default RemoveReviewWorkflow;
