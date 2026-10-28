import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import DigestWorkflow from "../workflows/digest.ts";

const digestShortcutTrigger: Trigger<typeof DigestWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Post PR review digest",
  description: "Post pending PR reviews to the dev channel now",
  workflow: `#/workflows/${DigestWorkflow.definition.callback_id}`,
  inputs: {},
};

export default digestShortcutTrigger;
