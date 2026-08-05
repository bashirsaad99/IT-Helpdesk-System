<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    /**
     * Display the authenticated user's tickets.
     */
    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::with([
                'creator:id,name,email',
                'assignee:id,name,email',
                'category:id,name',
                'priority:id,name',
                'status:id,name',
            ])
            ->where('created_by', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($tickets);
    }

    /**
     * Create a new ticket.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category_id' => [
                'required',
                'integer',
                'exists:ticket_categories,id',
            ],
            'priority_id' => [
                'required',
                'integer',
                'exists:ticket_priorities,id',
            ],
        ]);

        $openStatusId = TicketStatus::where('name', 'Open')->value('id');

        if (!$openStatusId) {
            return response()->json([
                'message' => 'The Open ticket status is not configured.',
            ], 500);
        }

        do {
            $ticketNumber = 'TKT-'
                . now()->format('YmdHis')
                . '-'
                . Str::upper(Str::random(4));
        } while (Ticket::where('ticket_number', $ticketNumber)->exists());

        $ticket = Ticket::create([
            'ticket_number' => $ticketNumber,
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'created_by' => $request->user()->id,
            'assigned_to' => null,
            'category_id' => $validated['category_id'],
            'priority_id' => $validated['priority_id'],
            'status_id' => $openStatusId,
        ]);

        $ticket->load([
            'creator:id,name,email',
            'assignee:id,name,email',
            'category:id,name',
            'priority:id,name',
            'status:id,name',
        ]);

        return response()->json([
            'message' => 'Ticket created successfully.',
            'ticket' => $ticket,
        ], 201);
    }

    /**
     * Display one ticket belonging to the authenticated user.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::with([
                'creator:id,name,email',
                'assignee:id,name,email',
                'category:id,name',
                'priority:id,name',
                'status:id,name',
            ])
            ->where('created_by', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'ticket' => $ticket,
        ]);
    }

    /**
     * Update one ticket belonging to the authenticated user.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::where('created_by', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'subject' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:ticket_categories,id',
            ],
            'priority_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:ticket_priorities,id',
            ],
        ]);

        $ticket->update($validated);

        $ticket->load([
            'creator:id,name,email',
            'assignee:id,name,email',
            'category:id,name',
            'priority:id,name',
            'status:id,name',
        ]);

        return response()->json([
            'message' => 'Ticket updated successfully.',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Delete one ticket belonging to the authenticated user.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::where('created_by', $request->user()->id)
            ->findOrFail($id);

        $ticket->delete();

        return response()->json([
            'message' => 'Ticket deleted successfully.',
        ]);
    }
}