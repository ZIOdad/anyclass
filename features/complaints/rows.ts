import type { StoredComplaint } from "./classification";

export const COMPLAINT_COLUMNS =
  "id, body, problem_type, facility, urgency, needs_review, multiple_issues, classifier, created_at, confirmed_at, resolved_at";

export type ComplaintRow = {
  id: string;
  body: string;
  problem_type: StoredComplaint["problemType"];
  facility: StoredComplaint["facility"];
  urgency: StoredComplaint["urgency"];
  needs_review: boolean;
  multiple_issues: boolean;
  classifier: string;
  created_at: string;
  confirmed_at: string | null;
  resolved_at: string | null;
};

export type ComplaintView = StoredComplaint & {
  classifier: string;
  confirmedAt: string | null;
  resolvedAt: string | null;
};

export function toComplaintView(row: ComplaintRow): ComplaintView {
  return {
    id: row.id,
    body: row.body,
    problemType: row.problem_type,
    facility: row.facility,
    urgency: row.urgency,
    needsReview: row.needs_review,
    multipleIssues: row.multiple_issues,
    classifier: row.classifier,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    resolvedAt: row.resolved_at,
  };
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

export function formatReceivedAt(iso: string): string {
  return dateFormat.format(new Date(iso));
}
