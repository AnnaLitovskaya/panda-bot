import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { AddReviewDefinition } from "../functions/add_review.ts";

const AddReviewWorkflow = DefineWorkflow({
  callback_id: "add_review_workflow",
  title: "Request PR review",
  description: "Track a GitHub PR and ping reviewers",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = AddReviewWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "Request a PR review",
  interactivity: AddReviewWorkflow.inputs.interactivity,
  submit_label: "Request review",
  fields: {
    elements: [
      { name: "pr_url", title: "GitHub PR URL", type: Schema.types.string },
      {
        name: "urgency",
        title: "Urgency",
        type: Schema.types.string,
        enum: ["high", "normal", "low"],
      },
      {
        name: "reviewers",
        title: "Reviewers",
        type: Schema.types.array,
        items: { type: Schema.slack.types.user_id },
      },
      { name: "note", title: "Note", type: Schema.types.string },
    ],
    required: ["pr_url", "urgency", "reviewers"],
  },
});

AddReviewWorkflow.addStep(AddReviewDefinition, {
  pr_url: form.outputs.fields.pr_url,
  urgency: form.outputs.fields.urgency,
  reviewers: form.outputs.fields.reviewers,
  note: form.outputs.fields.note,
  owner: AddReviewWorkflow.inputs.user,
});

export default AddReviewWorkflow;
