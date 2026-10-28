import { Manifest } from "deno-slack-sdk/mod.ts";
import AddReviewWorkflow from "./workflows/add_review.ts";
import RemoveReviewWorkflow from "./workflows/remove_review.ts";
import MarkDoneWorkflow from "./workflows/mark_done.ts";
import DigestWorkflow from "./workflows/digest.ts";
import PrReviewsDatastore from "./datastores/pr_reviews.ts";
import PrWatchDatastore from "./datastores/pr_watch.ts";
import WatchWorkflow from "./workflows/watch.ts";

export default Manifest({
  name: "Panda Bot",
  description:
    "Track GitHub PRs that need review and post reminders to the dev channel",
  icon: "assets/nerdy_panda.jpeg",
  workflows: [
    AddReviewWorkflow,
    RemoveReviewWorkflow,
    MarkDoneWorkflow,
    DigestWorkflow,
    WatchWorkflow,
  ],
  outgoingDomains: ["api.github.com"],
  datastores: [PrReviewsDatastore, PrWatchDatastore],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "im:write",
  ],
});
