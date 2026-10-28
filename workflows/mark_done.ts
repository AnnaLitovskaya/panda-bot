import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { MarkDoneDefinition } from "../functions/mark_done.ts";

const MarkDoneWorkflow = DefineWorkflow({
  callback_id: "mark_done_workflow",
  title: "Mark PR review done",
  description: "Mark your review of a PR as finished",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = MarkDoneWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "Mark a review done",
  interactivity: MarkDoneWorkflow.inputs.interactivity,
  submit_label: "Mark done",
  fields: {
    elements: [{
      name: "pr_url",
      title: "GitHub PR URL",
      type: Schema.types.string,
    }],
    required: ["pr_url"],
  },
});

MarkDoneWorkflow.addStep(MarkDoneDefinition, {
  pr_url: form.outputs.fields.pr_url,
  user: MarkDoneWorkflow.inputs.user,
  channel: MarkDoneWorkflow.inputs.channel,
});

export default MarkDoneWorkflow;
