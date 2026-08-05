<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketCommentController extends Controller
{
    /**
     * Display comments for a ticket the logged-in user may access.
     */
    public function index(Request $request, string $ticketId): JsonResponse
    {
        $ticket = $this->findAccessibleTicket($request, $ticketId);

        $comments = $ticket->comments()
            ->with('user:id,name,email')
            ->get();

        return response()->json([
            'comments' => $comments,
        ]);
    }

    /**
     * Add a comment to an accessible ticket.
     */
    public function store(Request $request, string $ticketId): JsonResponse
    {
        $validated = $request->validate([
            'comment' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $ticket = $this->findAccessibleTicket($request, $ticketId);

        $comment = $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'comment' => $validated['comment'],
        ]);

        $comment->load('user:id,name,email');

        return response()->json([
            'message' => 'Comment added successfully.',
            'comment' => $comment,
        ], 201);
    }

    /**
     * Find a ticket according to the logged-in user's role.
     */
    private function findAccessibleTicket(
        Request $request,
        string $ticketId
    ): Ticket {
        $user = $request->user();

        $role = is_string($user->role)
            ? strtolower($user->role)
            : strtolower($user->role?->name ?? '');

        $query = Ticket::query();

        if ($role === 'employee') {
            $query->where('created_by', $user->id);
        } elseif ($role === 'technician') {
            $query->where('assigned_to', $user->id);
        } elseif ($role !== 'admin') {
            abort(403, 'You are not authorized to access this ticket.');
        }

        return $query->findOrFail($ticketId);
    }
}