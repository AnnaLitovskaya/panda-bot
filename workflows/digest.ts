import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { PostDigestDefinition } from "../functions/post_digest.ts";

const DigestWorkflow = DefineWorkflow({
  callback_id: "digest_workflow",
  title: "PR review digest",
  description: "Post pending PR reviews to the dev channel",
  input_parameters: {
    properties: {},
    required: [],
  },
});

DigestWorkflow.addStep(PostDigestDefinition, {});

export default DigestWorkflow;
