import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import PrReviewsDatastore from "../datastores/pr_reviews.ts";
import PrWatchDatastore from "../datastores/pr_watch.ts";
import {
  DATASTORE,
  parsePrUrl,
  WATCH_DATASTORE,
  watchKey,
} from "../lib/prs.ts";

export const SetWatchDefinition = DefineFunction({
  callback_id: "set_watch",
  title: "Watch or ignore PR",
  description: "Choose whether to get direct messages about a PR",
  source_file: "functions/set_watch.ts",
  input_parameters: {
    properties: {
      pr_url: { type: Schema.types.string },
      mode: { type: Schema.types.string },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["pr_url", "mode", "user"],
  },
  output_parameters: {
    properties: { message: { type: Schema.types.string } },
    required: ["message"],
  },
});

export default SlackFunction(
  SetWatchDefinition,
  async ({ inputs, client }) => {
    const message = await applyWatch(inputs.pr_url, inputs.mode, inputs.user);
    await client.chat.postMessage({ channel: inputs.user, text: message });
    return { outputs: { message } };

    async function applyWatch(
      rawUrl: string,
      mode: string,
      userId: string,
    ): Promise<string> {
      const pr = parsePrUrl(rawUrl);
      if (!pr) return "That isn't a GitHub PR URL.";

      const tracked =
        (await client.apps.datastore.get<typeof PrReviewsDatastore.definition>({
          datastore: DATASTORE,
          id: pr.url,
        })).item;
      if (!tracked) return "That PR isn't tracked.";

      const key = watchKey(pr.url, userId);
      if (mode === "default") {
        await client.apps.datastore.delete({
          datastore: WATCH_DATASTORE,
          id: key,
        });
        return `Reset your setting for <${pr.url}|${tracked.title}>. You'll get DMs only if you're a reviewer.`;
      }

      await client.apps.datastore.put<typeof PrWatchDatastore.definition>({
        datastore: WATCH_DATASTORE,
        item: { key, pr_url: pr.url, user_id: userId, mode },
      });
      return `Set to *${mode}* for <${pr.url}|${tracked.title}>.`;
    }
  },
);
