export const DATASTORE = "PrReviews";

export interface PrItem {
  pr_url: string;
  title: string;
  owner_id: string;
  urgency: string;
  reviewers: string;
  done: string;
  created_at: string;
}

export interface PrRef {
  url: string;
  owner: string;
  repo: string;
  number: number;
}

export interface PrStatus {
  found: boolean;
  open: boolean;
  title: string;
  checks: string;
  review: string;
  mergeQueue: string;
}

export const URGENCY_RANK: Record<string, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

const PR_RE = /https:\/\/github\.com\/([^/\s<>|]+)\/([^/\s<>|]+)\/pull\/(\d+)/;

export function parsePrUrl(text: string): PrRef | undefined {
  const m = text.match(PR_RE);
  if (!m) return undefined;
  const [, owner, repo, num] = m;
  return {
    url: `https://github.com/${owner}/${repo}/pull/${num}`,
    owner,
    repo,
    number: Number(num),
  };
}

export const toList = (
  s: string | undefined,
): string[] => (s ? s.split(",").filter(Boolean) : []);
export const toCsv = (items: string[]): string => items.join(",");

export const WATCH_DATASTORE = "PrWatch";

export interface WatchItem {
  key?: string;
  pr_url?: string;
  user_id?: string;
  mode?: string;
}

export const watchKey = (prUrl: string, userId: string): string =>
  `${prUrl}|${userId}`;

const usersWithMode = (prUrl: string, mode: string, watches: WatchItem[]) =>
  watches
    .filter((w) => w.pr_url === prUrl && w.mode === mode)
    .map((w) => w.user_id)
    .filter((id): id is string => id !== undefined);

export function ignoredFor(prUrl: string, watches: WatchItem[]): string[] {
  return usersWithMode(prUrl, "ignore", watches);
}

export function recipientsFor(
  prUrl: string,
  reviewers: string[],
  watches: WatchItem[],
): string[] {
  const watching = usersWithMode(prUrl, "watch", watches);
  const ignored = ignoredFor(prUrl, watches);
  return [...new Set([...reviewers, ...watching])].filter((id) =>
    !ignored.includes(id)
  );
}

const QUERY = `query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      title
      state
      reviewDecision
      mergeQueueEntry { state }
      commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
    }
  }
}`;

export async function fetchPrStatus(
  pr: PrRef,
  token: string,
): Promise<PrStatus> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { owner: pr.owner, repo: pr.repo, number: pr.number },
    }),
  });
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

  const { data, errors } = await res.json();
  const pull = data?.repository?.pullRequest;
  if (!pull) {
    if (errors?.length) throw new Error(errors[0].message);
    return {
      found: false,
      open: false,
      title: "",
      checks: "NONE",
      review: "NONE",
      mergeQueue: "NOT_QUEUED",
    };
  }

  return {
    found: true,
    open: pull.state === "OPEN",
    title: pull.title,
    checks: pull.commits.nodes[0]?.commit.statusCheckRollup?.state ?? "NONE",
    review: pull.reviewDecision ?? "NONE",
    mergeQueue: pull.mergeQueueEntry?.state ?? "NOT_QUEUED",
  };
}
