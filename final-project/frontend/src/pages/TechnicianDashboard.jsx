import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function TechnicianDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    loadTickets();
    loadStatuses();
  }, []);

  function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  }

  async function loadTickets() {
    const token = localStorage.getItem("token");

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/technician/tickets",
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load assigned tickets.");
      }

      setTickets(data.data || []);
    } catch (requestError) {
      setError(requestError.message || "Cannot connect to the Laravel server.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStatuses(ticketId = null) {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/technician/statuses${ticketId ? `?ticket_id=${ticketId}` : ""}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load statuses.");
      }

      setStatuses(data.statuses || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load statuses.");
    }
  }

  function openTicket(ticket) {
    setSelectedTicket(ticket);
    setSelectedStatus(ticket.status_id ?? "");
    setSuccessMessage("");
    setError("");
    setComments([]);
    setNewComment("");
    setIsInternal(false);
    setCommentError("");
    setCommentSuccess("");
    setActivities([]);
    setActivityError("");
    loadComments(ticket.id);
    loadActivities(ticket.id);
    loadStatuses(ticket.id);
  }

  async function loadActivities(ticketId) {
    const token = localStorage.getItem("token");

    setActivitiesLoading(true);
    setActivityError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/tickets/${ticketId}/activities`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load activity history.");
      }

      setActivities(data.activities || []);
    } catch (requestError) {
      setActivityError(
        requestError.message || "Unable to load activity history.",
      );
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function loadComments(ticketId) {
    const token = localStorage.getItem("token");

    setCommentsLoading(true);
    setCommentError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/tickets/${ticketId}/comments`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load comments.");
      }

      setComments(data.comments || []);
    } catch (requestError) {
      setCommentError(requestError.message || "Unable to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();

    if (!newComment.trim()) {
      setCommentError("Please enter a comment.");
      return;
    }

    const token = localStorage.getItem("token");

    setCommentSaving(true);
    setCommentError("");
    setCommentSuccess("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/tickets/${selectedTicket.id}/comments`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: newComment.trim(),
            is_internal: isInternal,
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : "";

        throw new Error(
          validationErrors || data.message || "Unable to add the comment.",
        );
      }

      setComments((currentComments) => [...currentComments, data.comment]);
      setNewComment("");
      setIsInternal(false);
      setCommentSuccess(data.message);
    } catch (requestError) {
      setCommentError(requestError.message || "Unable to add the comment.");
    } finally {
      setCommentSaving(false);
    }
  }

  async function updateStatus(event) {
    event.preventDefault();

    if (!selectedStatus) {
      setError("Please select a status.");
      return;
    }

    const token = localStorage.getItem("token");

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/technician/tickets/${selectedTicket.id}/status`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status_id: Number(selectedStatus),
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to update the ticket status.");
      }

      setSelectedTicket(data.ticket);
      setSelectedStatus(data.ticket.status_id);
      setSuccessMessage(data.message);
      await loadTickets();
      await loadActivities(data.ticket.id);
      await loadStatuses(data.ticket.id);
    } catch (requestError) {
      setError(requestError.message || "Unable to update the ticket status.");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleString();
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Technician Dashboard</h1>
          <p>Welcome, {user?.name || "Technician"}!</p>
        </div>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {loading && (
        <p className="dashboard-notice">Loading assigned tickets...</p>
      )}

      {!loading && error && !selectedTicket && (
        <p className="dashboard-error">{error}</p>
      )}

      {!loading && (
        <section className="tickets-section">
          <h2>My Assigned Tickets</h2>

          {tickets.length === 0 ? (
            <p>No tickets are currently assigned to you.</p>
          ) : (
            <div className="tickets-table-wrapper">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Ticket Number</th>
                    <th>Created By</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.ticket_number}</td>
                      <td>{ticket.creator?.name || "-"}</td>
                      <td>{ticket.subject}</td>
                      <td>{ticket.category?.name || "-"}</td>
                      <td>{ticket.priority?.name || "-"}</td>
                      <td>{ticket.status?.name || "-"}</td>
                      <td>{formatDate(ticket.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="view-button"
                          onClick={() => openTicket(ticket)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {selectedTicket && (
        <div
          className="ticket-modal-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <section
            className="ticket-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ticket-modal-header">
              <h2>Assigned Ticket Details</h2>

              <button
                type="button"
                className="modal-close-button"
                onClick={() => setSelectedTicket(null)}
              >
                ×
              </button>
            </div>

            <div className="ticket-details">
              <p>
                <strong>Ticket Number:</strong> {selectedTicket.ticket_number}
              </p>

              <p>
                <strong>Created By:</strong>{" "}
                {selectedTicket.creator?.name || "-"}
              </p>

              <p>
                <strong>Creator Email:</strong>{" "}
                {selectedTicket.creator?.email || "-"}
              </p>

              <p>
                <strong>Subject:</strong> {selectedTicket.subject}
              </p>

              <p>
                <strong>Description:</strong>
              </p>

              <p className="ticket-description">{selectedTicket.description}</p>

              <p>
                <strong>Category:</strong>{" "}
                {selectedTicket.category?.name || "-"}
              </p>

              <p>
                <strong>Priority:</strong>{" "}
                {selectedTicket.priority?.name || "-"}
              </p>

              <p>
                <strong>Current Status:</strong>{" "}
                {selectedTicket.status?.name || "-"}
              </p>

              <p>
                <strong>Created:</strong>{" "}
                {formatDate(selectedTicket.created_at)}
              </p>
            </div>

            <form className="ticket-edit-form" onSubmit={updateStatus}>
              <h3>Update Ticket Status</h3>

              <label>
                Status
                <select
                  required
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                >
                  <option value="">Select status</option>

                  <option value={selectedTicket.status_id}>
                    {selectedTicket.status?.name} (current)
                  </option>

                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </label>

              {error && <p className="dashboard-error">{error}</p>}

              {successMessage && (
                <p className="dashboard-success">{successMessage}</p>
              )}

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update Status"}
              </button>
            </form>

            <section className="ticket-activities">
              <h3>Activity History</h3>

              {activitiesLoading ? (
                <p>Loading activity history...</p>
              ) : activityError ? (
                <p className="dashboard-error">{activityError}</p>
              ) : activities.length === 0 ? (
                <p>No activity recorded yet.</p>
              ) : (
                <div className="activities-list">
                  {activities.map((activity) => (
                    <article className="activity-card" key={activity.id}>
                      <div className="activity-header">
                        <strong>
                          {activity.user?.name || "Unknown user"}
                        </strong>
                        <span>{formatDate(activity.created_at)}</span>
                      </div>

                      <p>{activity.description}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="ticket-comments">
              <h3>Replies &amp; Internal Notes</h3>

              {commentsLoading ? (
                <p>Loading comments...</p>
              ) : comments.length === 0 ? (
                <p>No comments yet.</p>
              ) : (
                <div className="comments-list">
                  {comments.map((comment) => (
                    <article className="comment-card" key={comment.id}>
                      <div className="comment-header">
                        <strong>{comment.user?.name || "Unknown user"}</strong>
                        <span>{formatDate(comment.created_at)}</span>
                      </div>

                      <p>
                        {comment.is_internal && <strong>Internal note: </strong>}
                        {comment.comment}
                      </p>
                    </article>
                  ))}
                </div>
              )}

              <form className="comment-form" onSubmit={addComment}>
                <label htmlFor="technician-comment">Add Comment</label>

                <textarea
                  id="technician-comment"
                  rows="4"
                  maxLength="5000"
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  required
                />

                <label className="internal-note-option">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(event) => setIsInternal(event.target.checked)}
                  />
                  Internal note (employees cannot see it)
                </label>

                {commentError && (
                  <p className="dashboard-error">{commentError}</p>
                )}

                {commentSuccess && (
                  <p className="dashboard-success">{commentSuccess}</p>
                )}

                <button type="submit" disabled={commentSaving}>
                  {commentSaving ? "Adding..." : isInternal ? "Add Internal Note" : "Add Reply"}
                </button>
              </form>
            </section>

            <button
              type="button"
              className="modal-done-button"
              onClick={() => setSelectedTicket(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default TechnicianDashboard;
