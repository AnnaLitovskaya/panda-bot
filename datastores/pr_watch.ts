import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

const PrWatchDatastore = DefineDatastore({
  name: "PrWatch",
  primary_key: "key",
  attributes: {
    key: { type: Schema.types.string },
    pr_url: { type: Schema.types.string },
    user_id: { type: Schema.types.string },
    mode: { type: Schema.types.string },
  },
});

export default PrWatchDatastore;
