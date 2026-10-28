import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import PrReviewsDatastore from "../datastores/pr_reviews.ts";
import PrWatchDatastore from "../datastores/pr_watch.ts";
import {
  DATASTORE,
  fetchPrStatus,
  parsePrUrl,
  PrStatus,
  recipientsFor,
  toList,
  URGENCY_RANK,
  WATCH_DATASTORE,
} from "../lib/prs.ts";

const icon = (state: string) =>
  ({
    SUCCESS: ":white_check_mark:",
    FAILURE: ":x:",
    ERROR: ":x:",
    PENDING: ":hourglass:",
    EXPECTED: ":hourglass:",
  })[
    state
  ] ?? ":grey_question:";

const describe = (s: PrStatus) => {
  const queue = s.mergeQueue === "NOT_QUEUED"
    ? ""
    : ` · queue: ${s.mergeQueue.toLowerCase().replace("_", " ")}`;
  const review = s.review === "APPROVED"
    ? " · approved"
    : s.review === "CHANGES_REQUESTED"
    ? " · changes requested"
    : "";
  return `tests ${icon(s.checks)}${review}${queue}`;
};

export const PostDigestDefinition = DefineFunction({
  callback_id: "post_digest",
  title: "Post PR review digest",
  description: "Post pending PR reviews to the dev channel",
  source_file: "functions/post_digest.ts",
  input_parameters: { properties: {}, required: [] },
  output_parameters: {
    properties: { message: { type: Schema.types.string } },
    required: ["message"],
  },
});

export default SlackFunction(PostDigestDefinition, async ({ env, client }) => {
  const res = await client.apps.datastore.query<
    typeof PrReviewsDatastore.definition
  >({ datastore: DATASTORE });
  const items = (res.items ?? []).sort(
    (a, b) =>
      (URGENCY_RANK[a.urgency] ?? 1) - (URGENCY_RANK[b.urgency] ?? 1) ||
      a.created_at.localeCompare(b.created_at),
  );

  const watches = (
    await client.apps.datastore.query<typeof PrWatchDatastore.definition>({
      datastore: WATCH_DATASTORE,
    })
  ).items ?? [];
  const dms = new Map<string, string[]>();
  const lines: string[] = [];
  for (const item of items) {
    const pending = toList(item.reviewers).filter((id) =>
      !toList(item.done).includes(id)
    );
    if (!pending.length) continue;

    const pr = parsePrUrl(item.pr_url);
    if (!pr) continue;

    const status = await fetchPrStatus(pr, env.GITHUB_TOKEN).catch(() =>
      undefined
    );
    if (status?.found && !status.open) {
      await client.apps.datastore.delete({
        datastore: DATASTORE,
        id: item.pr_url,
      });
      continue;
    }

    const days = Math.floor(
      (Date.now() - Date.parse(item.created_at)) / 86_400_000,
    );
    const title = status?.title || item.title;
    const state = status ? ` · ${describe(status)}` : "";
    lines.push(
      `• *${item.urgency.toUpperCase()}* <${item.pr_url}|${title}> — owner <@${item.owner_id}> — waiting on ${
        pending.map((id) => `<@${id}>`).join(" ")
      } — ${days}d old${state}`,
    );
    for (const id of recipientsFor(item.pr_url, pending, watches)) {
      dms.set(id, [
        ...(dms.get(id) ?? []),
        `• *${item.urgency.toUpperCase()}* <${item.pr_url}|${title}> — ${days}d old`,
      ]);
    }
  }

  for (const [id, userLines] of dms) {
    await client.chat.postMessage({
      channel: id,
      text: `:bell: *Your PR reviews pending*\n${userLines.join("\n")}`,
    });
  }

  const message = lines.length
    ? `:bell: *PR reviews pending*\n${lines.join("\n")}`
    : "No PR reviews pending.";
  if (lines.length) {
    await client.chat.postMessage({
      channel: env.DEV_CHANNEL_ID,
      text: message,
    });
  }
  return { outputs: { message } };
});
