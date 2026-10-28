import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SetWatchDefinition } from "../functions/set_watch.ts";

const WatchWorkflow = DefineWorkflow({
  callback_id: "watch_workflow",
  title: "Watch or ignore PR",
  description: "Choose whether to get direct messages about a PR",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = WatchWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "Watch or ignore a PR",
  interactivity: WatchWorkflow.inputs.interactivity,
  submit_label: "Save",
  fields: {
    elements: [
      { name: "pr_url", title: "GitHub PR URL", type: Schema.types.string },
      {
        name: "mode",
        title: "Setting",
        type: Schema.types.string,
        enum: ["watch", "ignore", "default"],
      },
    ],
    required: ["pr_url", "mode"],
  },
});

WatchWorkflow.addStep(SetWatchDefinition, {
  pr_url: form.outputs.fields.pr_url,
  mode: form.outputs.fields.mode,
  user: WatchWorkflow.inputs.user,
});

export default WatchWorkflow;
