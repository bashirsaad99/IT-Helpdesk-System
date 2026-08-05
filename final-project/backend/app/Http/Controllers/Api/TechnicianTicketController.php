<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TechnicianTicketController extends Controller
{
    /**
     * Display tickets assigned to the logged-in technician.
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
            ->where('assigned_to', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($tickets);
    }

    /**
     * Display one ticket assigned to the logged-in technician.
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
            ->where('assigned_to', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'ticket' => $ticket,
        ]);
    }

    /**
     * Update the status of an assigned ticket
     * and record the change in ticket activity history.
     */
    public function updateStatus(
        Request $request,
        string $id
    ): JsonResponse {
        $validated = $request->validate([
            'status_id' => [
                'required',
                'integer',
                'exists:ticket_statuses,id',
            ],
        ]);

        $ticket = Ticket::with('status:id,name')
            ->where('assigned_to', $request->user()->id)
            ->findOrFail($id);

        DB::transaction(function () use (
            $request,
            $ticket,
            $validated
        ): void {
            $oldStatusId = $ticket->status_id;
            $oldStatusName = $ticket->status?->name ?? 'Unknown';

            $ticket->update([
                'status_id' => $validated['status_id'],
            ]);

            $ticket->load('status:id,name');

            if ((int) $oldStatusId !== (int) $ticket->status_id) {
                $newStatusName = $ticket->status?->name ?? 'Unknown';

                $ticket->activities()->create([
                    'user_id' => $request->user()->id,
                    'action' => 'updated',
                    'field' => 'status_id',
                    'old_value' => $oldStatusId,
                    'new_value' => $ticket->status_id,
                    'description' =>
                        "Status changed from {$oldStatusName} " .
                        "to {$newStatusName}.",
                ]);
            }
        });

        $ticket->load([
            'creator:id,name,email',
            'assignee:id,name,email',
            'category:id,name',
            'priority:id,name',
            'status:id,name',
        ]);

        return response()->json([
            'message' => 'Ticket status updated successfully.',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Display the available ticket statuses.
     */
    public function statuses(): JsonResponse
    {
        return response()->json([
            'statuses' => TicketStatus::query()
                ->orderBy('id')
                ->get(['id', 'name']),
        ]);
    }
}