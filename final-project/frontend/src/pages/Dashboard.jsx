import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const categories = [
  { id: 1, name: 'Hardware' },
  { id: 2, name: 'Software' },
  { id: 3, name: 'Network' },
  { id: 4, name: 'Account' },
  { id: 5, name: 'Other' },
]

const priorities = [
  { id: 1, name: 'Low' },
  { id: 2, name: 'Medium' },
  { id: 3, name: 'High' },
  { id: 4, name: 'Urgent' },
]

function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const [tickets, setTickets] = useState([])
  const [totalTickets, setTotalTickets] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('1')
  const [priorityId, setPriorityId] = useState('2')
  const [creating, setCreating] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [editingTicketId, setEditingTicketId] = useState(null)
  const [deletingTicketId, setDeletingTicketId] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentSaving, setCommentSaving] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [commentSuccess, setCommentSuccess] = useState('')

  useEffect(() => {
    loadTickets()
  }, [])

  function handleUnauthorized() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
    window.location.reload()
  }

  async function loadTickets() {
    const token = localStorage.getItem('token')

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/tickets',
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load tickets.')
      }

      setTickets(data.data || [])
      setTotalTickets(data.total || 0)
    } catch (requestError) {
      setError(
        requestError.message || 'Cannot connect to the Laravel server.',
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setSubject('')
    setDescription('')
    setCategoryId('1')
    setPriorityId('2')
    setEditingTicketId(null)
  }

  async function handleSubmitTicket(event) {
    event.preventDefault()

    const token = localStorage.getItem('token')
    const isEditing = editingTicketId !== null

    setCreating(true)
    setFormMessage('')

    try {
      const url = isEditing
        ? `http://127.0.0.1:8000/api/tickets/${editingTicketId}`
        : 'http://127.0.0.1:8000/api/tickets'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          description,
          category_id: Number(categoryId),
          priority_id: Number(priorityId),
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : ''

        throw new Error(
          validationErrors ||
            data.message ||
            'Unable to save the ticket.',
        )
      }

      if (isEditing) {
        setTickets((currentTickets) =>
          currentTickets.map((ticket) =>
            ticket.id === editingTicketId ? data.ticket : ticket,
          ),
        )

        setFormMessage('Ticket updated successfully.')
      } else {
        setTickets((currentTickets) => [
          data.ticket,
          ...currentTickets,
        ])

        setTotalTickets((currentTotal) => currentTotal + 1)
        setFormMessage('Ticket created successfully.')
      }

      resetForm()
    } catch (requestError) {
      setFormMessage(
        requestError.message || 'Cannot connect to the server.',
      )
    } finally {
      setCreating(false)
    }
  }

  function handleEdit(ticket) {
    setEditingTicketId(ticket.id)
    setSubject(ticket.subject)
    setDescription(ticket.description)
    setCategoryId(String(ticket.category_id))
    setPriorityId(String(ticket.priority_id))
    setFormMessage('')

    window.scrollTo({
      top: 500,
      behavior: 'smooth',
    })
  }

  function handleCancelEdit() {
    resetForm()
    setFormMessage('')
  }

  async function handleDelete(ticket) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${ticket.subject}"?`,
    )

    if (!confirmed) {
      return
    }

    const token = localStorage.getItem('token')
    setDeletingTicketId(ticket.id)

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/tickets/${ticket.id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete the ticket.')
      }

      setTickets((currentTickets) =>
        currentTickets.filter(
          (currentTicket) => currentTicket.id !== ticket.id,
        ),
      )

      setTotalTickets((currentTotal) =>
        Math.max(0, currentTotal - 1),
      )

      if (editingTicketId === ticket.id) {
        resetForm()
      }

      setSelectedTicket(null)
      setFormMessage('Ticket deleted successfully.')
    } catch (requestError) {
      setFormMessage(
        requestError.message || 'Cannot connect to the server.',
      )
    } finally {
      setDeletingTicketId(null)
    }
  }
async function loadComments(ticketId) {
  const token = localStorage.getItem('token')

  setCommentsLoading(true)
  setCommentError('')

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/tickets/${ticketId}/comments`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const data = await response.json()

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load comments.')
    }

    setComments(data.comments || [])
  } catch (requestError) {
    setCommentError(
      requestError.message || 'Unable to load comments.',
    )
  } finally {
    setCommentsLoading(false)
  }
}

function openTicket(ticket) {
  setSelectedTicket(ticket)
  setComments([])
  setNewComment('')
  setCommentError('')
  setCommentSuccess('')
  loadComments(ticket.id)
}

async function addComment(event) {
  event.preventDefault()

  if (!newComment.trim()) {
    setCommentError('Please enter a comment.')
    return
  }

  const token = localStorage.getItem('token')

  setCommentSaving(true)
  setCommentError('')
  setCommentSuccess('')

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/tickets/${selectedTicket.id}/comments`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: newComment.trim(),
        }),
      },
    )

    const data = await response.json()

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      const validationErrors = data.errors
        ? Object.values(data.errors).flat().join(' ')
        : ''

      throw new Error(
        validationErrors ||
          data.message ||
          'Unable to add the comment.',
      )
    }

    setComments((currentComments) => [
      ...currentComments,
      data.comment,
    ])

    setNewComment('')
    setCommentSuccess(data.message)
  } catch (requestError) {
    setCommentError(
      requestError.message || 'Unable to add the comment.',
    )
  } finally {
    setCommentSaving(false)
  }
}
  function countTicketsByStatus(statusName) {
    return tickets.filter(
      (ticket) =>
        ticket.status?.name?.toLowerCase() ===
        statusName.toLowerCase(),
    ).length
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return '-'
    }

    return new Date(dateValue).toLocaleString()
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
    window.location.reload()
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>IT Help Desk Dashboard</h1>
          <p>Welcome, {user?.name || 'User'}!</p>
        </div>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {loading && (
        <p className="dashboard-notice">Loading tickets...</p>
      )}

      {error && <p className="dashboard-error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="summary-grid">
            <article className="summary-card">
              <h2>Total Tickets</h2>
              <strong>{totalTickets}</strong>
            </article>

            <article className="summary-card">
              <h2>Open Tickets</h2>
              <strong>{countTicketsByStatus('Open')}</strong>
            </article>

            <article className="summary-card">
              <h2>In Progress</h2>
              <strong>{countTicketsByStatus('In Progress')}</strong>
            </article>

            <article className="summary-card">
              <h2>Resolved</h2>
              <strong>{countTicketsByStatus('Resolved')}</strong>
            </article>
          </section>

          <section className="ticket-form-section">
            <h2>
              {editingTicketId ? 'Edit Ticket' : 'Create New Ticket'}
            </h2>

            <form
              className="ticket-form"
              onSubmit={handleSubmitTicket}
            >
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Enter the ticket subject"
                maxLength="255"
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the problem"
                rows="5"
                required
              />

              <div className="ticket-form-row">
                <div>
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(event.target.value)
                    }
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={priorityId}
                    onChange={(event) =>
                      setPriorityId(event.target.value)
                    }
                    required
                  >
                    {priorities.map((priority) => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ticket-form-actions">
                <button type="submit" disabled={creating}>
                  {creating
                    ? 'Saving...'
                    : editingTicketId
                      ? 'Update Ticket'
                      : 'Create Ticket'}
                </button>

                {editingTicketId && (
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {formMessage && (
                <p className="form-message">{formMessage}</p>
              )}
            </form>
          </section>

          <section className="tickets-section">
            <h2>My Tickets</h2>

            {tickets.length === 0 ? (
              <p>You have no tickets yet.</p>
            ) : (
              <div className="tickets-table-wrapper">
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>Ticket Number</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.ticket_number}</td>
                        <td>{ticket.subject}</td>
                        <td>{ticket.category?.name || '-'}</td>
                        <td>{ticket.priority?.name || '-'}</td>
                        <td>{ticket.status?.name || '-'}</td>
                        <td>
                          <div className="ticket-actions">
                            <button
                              type="button"
                              className="view-button"
                              onClick={() => openTicket(ticket)}
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => handleEdit(ticket)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => handleDelete(ticket)}
                              disabled={
                                deletingTicketId === ticket.id
                              }
                            >
                              {deletingTicketId === ticket.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
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
                    <strong>Ticket Number:</strong>{' '}
                    {selectedTicket.ticket_number}
                  </p>

                  <p>
                    <strong>Subject:</strong>{' '}
                    {selectedTicket.subject}
                  </p>

                  <p>
                    <strong>Description:</strong>
                  </p>

                  <p className="ticket-description">
                    {selectedTicket.description}
                  </p>

                  <p>
                    <strong>Category:</strong>{' '}
                    {selectedTicket.category?.name || '-'}
                  </p>

                  <p>
                    <strong>Priority:</strong>{' '}
                    {selectedTicket.priority?.name || '-'}
                  </p>

                  <p>
                    <strong>Status:</strong>{' '}
                    {selectedTicket.status?.name || '-'}
                  </p>

                  <p>
                    <strong>Assigned To:</strong>{' '}
                    {selectedTicket.assignee?.name || 'Not assigned'}
                  </p>

                  <p>
                    <strong>Created:</strong>{' '}
                    {formatDate(selectedTicket.created_at)}
                  </p>
                </div>

                <section className="ticket-comments">
                  <h3>Comments</h3>

                  {commentsLoading ? (
                    <p>Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p>No comments yet.</p>
                  ) : (
                    <div className="comments-list">
                      {comments.map((comment) => (
                        <article
                          className="comment-card"
                          key={comment.id}
                        >
                          <div className="comment-header">
                            <strong>
                              {comment.user?.name || 'Unknown user'}
                            </strong>
                            <span>
                              {formatDate(comment.created_at)}
                            </span>
                          </div>

                          <p>{comment.comment}</p>
                        </article>
                      ))}
                    </div>
                  )}

                  <form
                    className="comment-form"
                    onSubmit={addComment}
                  >
                    <label htmlFor="employee-comment">
                      Add Comment
                    </label>

                    <textarea
                      id="employee-comment"
                      rows="4"
                      maxLength="5000"
                      placeholder="Write your comment..."
                      value={newComment}
                      onChange={(event) =>
                        setNewComment(event.target.value)
                      }
                      required
                    />

                    {commentError && (
                      <p className="dashboard-error">
                        {commentError}
                      </p>
                    )}

                    {commentSuccess && (
                      <p className="dashboard-success">
                        {commentSuccess}
                      </p>
                    )}

                    <button type="submit" disabled={commentSaving}>
                      {commentSaving ? 'Adding...' : 'Add Comment'}
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
  )
}

export default Dashboard
