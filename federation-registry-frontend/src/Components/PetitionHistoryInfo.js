import React from "react";
import { Alert, Badge, Card, Col, Row } from "react-bootstrap";

const requestTypeKey = {
  create: "registration",
  edit: "reconfiguration",
  delete: "deregistration",
};

const formatDate = (value) => {
  if (!value) return null;

  return new Date(value).toLocaleString();
};

export default function PetitionHistoryInfo({ petition, t }) {
  const metadata = petition.metadata || {};

  const requestType = t(requestTypeKey[metadata.type] || "request");
  const reviewer = metadata.reviewer;
  const requester = metadata.requester_info;
  const statusText =
    metadata.status === "approved"
      ? t("history_info_approved")
      : metadata.status === "reject"
        ? t("history_info_rejected")
        : metadata.status === "pending"
          ? t("history_info_pending_review")
          : metadata.status === "changes"
            ? t("badge_changes_pending")
            : metadata.status === "approved_with_changes"
              ? t("history_info_approved_with_changes")
              : metadata.status === "request_review"
                ? t("history_info_request_review")
                : metadata.status;

  return (
    <>
      <Alert variant="warning" className="form-alert petition-review-alert">
        <div className="d-flex align-items-center flex-wrap">
          <strong className="mr-1">
            {metadata.status === "approved_with_changes"
              ? t("history_changes_requested_prefix")
              : t("history_info_1")}

            <span>
              {requestType}{" "}
              {metadata.status === "changes"
                ? t("history_info_changes_pending")
                : metadata.status === "pending"
                  ? t("history_info_2_pending")
                  : metadata.status === "request_review"
                    ? t("history_info_2_under")
                    : metadata.status !== "approved_with_changes"
                      ? t("history_info_2")
                      : t("Request")}
            </span>
          </strong>
          <Badge
            variant={
              metadata.status === "approved"
                ? "success"
                : metadata.status === "reject"
                  ? "danger"
                  : "warning"
            }
            className="ml-2 petition-status-badge"
          >
            {statusText}
          </Badge>
        </div>

        <Card className="mt-3 petition-review-card">
          <Card.Body>
            <Row>
              {requester && (
                <Col md={3}>
                  <div className="text-muted small">
                    {t("history_requester")}
                  </div>
                  <div>
                    {requester.name || requester.email || requester.sub}
                  </div>
                  {requester.email && (
                    <div className="text-muted small">{requester.email}</div>
                  )}
                </Col>
              )}
              {metadata.submitted_at && (
                <Col md={3}>
                  <div className="text-muted small">
                    {t("history_submitted_at")}
                  </div>
                  <div>{formatDate(metadata.submitted_at)}</div>
                </Col>
              )}
              {reviewer && (
                <Col md={3}>
                  <div className="text-muted small">
                    {t("history_reviewer")}
                  </div>
                  <div>{reviewer.name || reviewer.email || reviewer.sub}</div>
                  {reviewer.email && (
                    <div className="text-muted small">{reviewer.email}</div>
                  )}
                </Col>
              )}
              {metadata.reviewed_at && (
                <Col md={3}>
                  <div className="text-muted small">
                    {t("history_reviewed_at")}
                  </div>
                  <div>{formatDate(metadata.reviewed_at)}</div>
                </Col>
              )}
            </Row>

            {metadata.comment && (
              <>
                <hr />
                <div className="text-muted small mb-1">
                  {t("history_comment")}
                </div>
                <div className="text-comment petition-review-comment">
                  {metadata.comment}
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Alert>
    </>
  );
}
