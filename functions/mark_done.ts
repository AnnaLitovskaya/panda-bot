import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import PrReviewsDatastore from "../datastores/pr_reviews.ts";
import { DATASTORE, parsePrUrl, toCsv, toList } from "../lib/prs.ts";

export const MarkDoneDefinition = DefineFunction({
  callback_id: "mark_done",
  title: "Mark review done",
  description: "Mark your review of a PR as finished",
  source_file: "functions/mark_done.ts",
  input_parameters: {
    properties: {
      pr_url: { type: Schema.types.string },
      user: { type: Schema.slack.types.user_id },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["pr_url", "user", "channel"],
  },
  output_parameters: {
    properties: { message: { type: Schema.types.string } },
    required: ["message"],
  },
});

export default SlackFunction(
  MarkDoneDefinition,
  async ({ inputs, env, client }) => {
    const message = await markDone(inputs.pr_url, inputs.user);
    await client.chat.postMessage({ channel: inputs.user, text: message });
    return { outputs: { message } };

    async function markDone(rawUrl: string, userId: string): Promise<string> {
      const pr = parsePrUrl(rawUrl);
      if (!pr) return "That isn't a GitHub PR URL.";

      const existing =
        (await client.apps.datastore.get<typeof PrReviewsDatastore.definition>({
          datastore: DATASTORE,
          id: pr.url,
        })).item;
      if (!existing) return "That PR isn't tracked.";

      const reviewers = toList(existing.reviewers);
      const done = toList(existing.done);
      if (!reviewers.includes(userId) || done.includes(userId)) {
        return "You're not a pending reviewer on that PR.";
      }

      await client.apps.datastore.put({
        datastore: DATASTORE,
        item: { ...existing, done: toCsv([...done, userId]) },
      });
      await client.chat.postMessage({
        channel: env.DEV_CHANNEL_ID,
        text:
          `:white_check_mark: <@${userId}> finished reviewing <${pr.url}|${existing.title}>`,
      });
      return "Marked done. Thanks!";
    }
  },
);
