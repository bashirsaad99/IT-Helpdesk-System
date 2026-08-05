<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            ->when($this->role($request) === 'employee', fn ($query) => $query->where('is_internal', false))
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
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        $isInternal = (bool) ($validated['is_internal'] ?? false);
        if ($isInternal && $this->role($request) === 'employee') {
            abort(403, 'Employees cannot create internal notes.');
        }

        $ticket = $this->findAccessibleTicket($request, $ticketId);

        $comment = DB::transaction(function () use ($ticket, $request, $validated, $isInternal) {
            $comment = $ticket->comments()->create([
                'user_id' => $request->user()->id,
                'comment' => $validated['comment'],
                'is_internal' => $isInternal,
            ]);

            $ticket->activities()->create([
                'user_id' => $request->user()->id,
                'action' => $isInternal ? 'internal_note_added' : 'comment_added',
                'field' => 'comments',
                'new_value' => (string) $comment->id,
                'description' => $isInternal ? 'An internal note was added.' : 'A reply was added.',
            ]);

            return $comment;
        });

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

        $role = $this->role($request);

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

    private function role(Request $request): string
    {
        $role = $request->user()->role;
        return is_string($role) ? strtolower($role) : strtolower($role?->name ?? '');
    }
}
