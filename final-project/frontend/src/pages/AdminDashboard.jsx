import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [editForm, setEditForm] = useState({
    assigned_to: "",
    status_id: "",
    priority_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");

  useEffect(() => {
    loadTickets();
    loadOptions();
  }, []);

  function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  }

  async function loadOptions() {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/options", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load ticket options.");
      }

      setTechnicians(data.technicians || []);
      setStatuses(data.statuses || []);
      setPriorities(data.priorities || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load ticket options.");
    }
  }

  async function loadTickets() {
    const token = localStorage.getItem("token");

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/tickets", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load tickets.");
      }

      setTickets(data.data || []);
      setTotalTickets(data.total || 0);
    } catch (requestError) {
      setError(requestError.message || "Cannot connect to the Laravel server.");
    } finally {
      setLoading(false);
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

  function countTicketsByStatus(statusName) {
    return tickets.filter(
      (ticket) =>
        ticket.status?.name?.toLowerCase() === statusName.toLowerCase(),
    ).length;
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleString();
  }

  function openTicket(ticket) {
    setSelectedTicket(ticket);
    setSuccessMessage("");
    setError("");
    setComments([]);
    setNewComment("");
    setIsInternal(false);
    setActivities([]);
    setCommentError("");
    setCommentSuccess("");

    setEditForm({
      assigned_to: ticket.assigned_to ?? "",
      status_id: ticket.status_id ?? "",
      priority_id: ticket.priority_id ?? "",
    });

    loadComments(ticket.id);
    loadActivities(ticket.id);
  }

  async function loadActivities(ticketId) {
    const token = localStorage.getItem("token");
    setActivitiesLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tickets/${ticketId}/activities`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load history.");
      setActivities(data.activities || []);
    } catch (requestError) {
      setCommentError(requestError.message);
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function updateTicket(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/tickets/${selectedTicket.id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assigned_to:
              editForm.assigned_to === "" ? null : Number(editForm.assigned_to),
            status_id: Number(editForm.status_id),
            priority_id: Number(editForm.priority_id),
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
          validationErrors || data.message || "Unable to update the ticket.",
        );
      }

      setSelectedTicket(data.ticket);
      setSuccessMessage(data.message);
      await loadTickets();
      await loadActivities(data.ticket.id);
    } catch (requestError) {
      setError(requestError.message || "Unable to update the ticket.");
    } finally {
      setSaving(false);
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
      await loadActivities(selectedTicket.id);
    } catch (requestError) {
      setCommentError(requestError.message || "Unable to add the comment.");
    } finally {
      setCommentSaving(false);
    }
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
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user?.name || "Administrator"}!</p>
        </div>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {loading && <p className="dashboard-notice">Loading all tickets...</p>}

      {error && !selectedTicket && <p className="dashboard-error">{error}</p>}

      {!loading && (
        <>
          <section className="summary-grid">
            <article className="summary-card">
              <h2>Total Tickets</h2>
              <strong>{totalTickets}</strong>
            </article>

            <article className="summary-card">
              <h2>Open Tickets</h2>
              <strong>{countTicketsByStatus("Open")}</strong>
            </article>

            <article className="summary-card">
              <h2>In Progress</h2>
              <strong>{countTicketsByStatus("In Progress")}</strong>
            </article>

            <article className="summary-card">
              <h2>Resolved</h2>
              <strong>{countTicketsByStatus("Resolved")}</strong>
            </article>
          </section>

          <section className="tickets-section">
            <h2>All Users’ Tickets</h2>

            {tickets.length === 0 ? (
              <p>No tickets have been created yet.</p>
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
                      <th>Assigned To</th>
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
                        <td>{ticket.assignee?.name || "Not assigned"}</td>
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
                  <h2>Ticket Details</h2>

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
                    <strong>Ticket Number:</strong>{" "}
                    {selectedTicket.ticket_number}
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

                  <p className="ticket-description">
                    {selectedTicket.description}
                  </p>

                  <p>
                    <strong>Category:</strong>{" "}
                    {selectedTicket.category?.name || "-"}
                  </p>

                  <p>
                    <strong>Priority:</strong>{" "}
                    {selectedTicket.priority?.name || "-"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedTicket.status?.name || "-"}
                  </p>

                  <p>
                    <strong>Assigned To:</strong>{" "}
                    {selectedTicket.assignee?.name || "Not assigned"}
                  </p>

                  <p>
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedTicket.created_at)}
                  </p>
                </div>

                <form className="ticket-edit-form" onSubmit={updateTicket}>
                  <h3>Manage Ticket</h3>

                  <label>
                    Assign Technician
                    <select
                      value={editForm.assigned_to}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          assigned_to: event.target.value,
                        })
                      }
                    >
                      <option value="">Not assigned</option>

                      {technicians.map((technician) => (
                        <option key={technician.id} value={technician.id}>
                          {technician.name} — {technician.email}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Status
                    <select
                      required
                      value={editForm.status_id}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          status_id: event.target.value,
                        })
                      }
                    >
                      <option value="">Select status</option>

                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Priority
                    <select
                      required
                      value={editForm.priority_id}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          priority_id: event.target.value,
                        })
                      }
                    >
                      <option value="">Select priority</option>

                      {priorities.map((priority) => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {error && <p className="dashboard-error">{error}</p>}

                  {successMessage && (
                    <p className="dashboard-success">{successMessage}</p>
                  )}

                  <button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>

                <section className="ticket-activities">
                  <h3>Status Timeline &amp; Audit Trail</h3>
                  {activitiesLoading ? <p>Loading history...</p> : activities.length === 0 ? <p>No activity yet.</p> : (
                    <div className="activities-list">
                      {activities.map((activity) => (
                        <article className="activity-card" key={activity.id}>
                          <div className="activity-header">
                            <strong>{activity.user?.name || "System"}</strong>
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
                            <strong>
                              {comment.user?.name || "Unknown user"}
                            </strong>
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
                    <label htmlFor="admin-comment">Add Comment</label>

                    <textarea
                      id="admin-comment"
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
        </>
      )}
    </main>
  );
}

export default AdminDashboard;
