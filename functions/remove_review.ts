import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import PrReviewsDatastore from "../datastores/pr_reviews.ts";
import { DATASTORE, parsePrUrl } from "../lib/prs.ts";

export const RemoveReviewDefinition = DefineFunction({
  callback_id: "remove_review",
  title: "Remove PR review request",
  description: "Stop tracking a PR (owner only)",
  source_file: "functions/remove_review.ts",
  input_parameters: {
    properties: {
      pr_url: { type: Schema.types.string },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["pr_url", "user"],
  },
  output_parameters: {
    properties: { message: { type: Schema.types.string } },
    required: ["message"],
  },
});

export default SlackFunction(
  RemoveReviewDefinition,
  async ({ inputs, client }) => {
    const message = await removeIfOwner(inputs.pr_url, inputs.user);
    await client.chat.postMessage({ channel: inputs.user, text: message });
    return { outputs: { message } };

    async function removeIfOwner(
      rawUrl: string,
      userId: string,
    ): Promise<string> {
      const pr = parsePrUrl(rawUrl);
      if (!pr) return "That isn't a GitHub PR URL.";

      const existing =
        (await client.apps.datastore.get<typeof PrReviewsDatastore.definition>({
          datastore: DATASTORE,
          id: pr.url,
        })).item;
      if (!existing) return "That PR isn't tracked.";
      if (
        existing.owner_id !== userId
      ) return "Only the PR owner can remove it.";

      await client.apps.datastore.delete({ datastore: DATASTORE, id: pr.url });
      return `Removed <${pr.url}|${existing.title}>.`;
    }
  },
);
