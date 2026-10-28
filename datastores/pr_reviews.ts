import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

const PrReviewsDatastore = DefineDatastore({
  name: "PrReviews",
  primary_key: "pr_url",
  attributes: {
    pr_url: { type: Schema.types.string },
    title: { type: Schema.types.string },
    owner_id: { type: Schema.types.string },
    urgency: { type: Schema.types.string },
    reviewers: { type: Schema.types.string },
    done: { type: Schema.types.string },
    created_at: { type: Schema.types.string },
  },
});

export default PrReviewsDatastore;
