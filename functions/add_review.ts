import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import PrReviewsDatastore from "../datastores/pr_reviews.ts";
import PrWatchDatastore from "../datastores/pr_watch.ts";
import {
  DATASTORE,
  fetchPrStatus,
  ignoredFor,
  parsePrUrl,
  PrItem,
  toCsv,
  toList,
  WATCH_DATASTORE,
} from "../lib/prs.ts";

export const AddReviewDefinition = DefineFunction({
  callback_id: "add_review",
  title: "Request PR review",
  description: "Track a GitHub PR and ping reviewers",
  source_file: "functions/add_review.ts",
  input_parameters: {
    properties: {
      pr_url: { type: Schema.types.string },
      urgency: { type: Schema.types.string },
      reviewers: {
        type: Schema.types.array,
        items: { type: Schema.slack.types.user_id },
      },
      owner: { type: Schema.slack.types.user_id },
      note: { type: Schema.types.string },
    },
    required: ["pr_url", "urgency", "reviewers", "owner"],
  },
  output_parameters: {
    properties: { message: { type: Schema.types.string } },
    required: ["message"],
  },
});

export default SlackFunction(
  AddReviewDefinition,
  async ({ inputs, env, client }) => {
    const notifyOwner = (text: string) =>
      client.chat.postMessage({ channel: inputs.owner, text });
    const fail = async (message: string) => {
      await notifyOwner(message);
      return { outputs: { message } };
    };

    const pr = parsePrUrl(inputs.pr_url);
    if (!pr) return fail("That isn't a GitHub PR URL.");
    if (`${pr.owner}/${pr.repo}` !== env.GITHUB_REPO) {
      return fail(
        `Only ${env.GITHUB_REPO} is tracked.`,
      );
    }

    const reviewers = inputs.reviewers.filter((id) => id !== inputs.owner);
    if (!reviewers.length) {
      return fail(
        "Add at least one reviewer other than yourself.",
      );
    }

    const status = await fetchPrStatus(pr, env.GITHUB_TOKEN);
    if (!status.found) return fail("PR not found. Check the URL.");
    if (!status.open) return fail("That PR is closed or merged.");

    const existing =
      (await client.apps.datastore.get<typeof PrReviewsDatastore.definition>({
        datastore: DATASTORE,
        id: pr.url,
      })).item;
    if (existing && existing.owner_id !== inputs.owner) {
      return fail(`Already tracked, owned by <@${existing.owner_id}>.`);
    }

    const allReviewers = [
      ...new Set([...toList(existing?.reviewers), ...reviewers]),
    ];
    const item: PrItem = {
      pr_url: pr.url,
      title: status.title,
      owner_id: inputs.owner,
      urgency: inputs.urgency,
      reviewers: toCsv(allReviewers),
      done: existing?.done ?? "",
      created_at: existing?.created_at ?? new Date().toISOString(),
    };
    await client.apps.datastore.put({ datastore: DATASTORE, item });

    await client.chat.postMessage({
      channel: env.DEV_CHANNEL_ID,
      text:
        `:eyes: <@${inputs.owner}> requests review: <${pr.url}|${status.title}> [${inputs.urgency}] ${
          reviewers.map((id) => `<@${id}>`).join(" ")
        }`,
    });
    const watches = (
      await client.apps.datastore.query<typeof PrWatchDatastore.definition>({
        datastore: WATCH_DATASTORE,
      })
    ).items ?? [];
    const ignored = ignoredFor(pr.url, watches);
    const noteLine = inputs.note ? `\n> ${inputs.note}` : "";
    for (const id of allReviewers.filter((id) => !ignored.includes(id))) {
      await client.chat.postMessage({
        channel: id,
        text:
          `:eyes: <@${inputs.owner}> asked you to review <${pr.url}|${status.title}> [${inputs.urgency}]${noteLine}`,
      });
    }
    return { outputs: { message: "Added." } };
  },
);
