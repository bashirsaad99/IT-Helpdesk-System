<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminTicketController extends Controller
{
    /**
     * Display all users' tickets for the administrator.
     */
    public function index(): JsonResponse
    {
        $tickets = Ticket::with([
                'creator:id,name,email',
                'assignee:id,name,email',
                'category:id,name',
                'priority:id,name',
                'status:id,name',
            ])
            ->latest()
            ->paginate(10);

        return response()->json($tickets);
    }

    /**
     * Display one ticket.
     */
    public function show(string $id): JsonResponse
    {
        $ticket = Ticket::with([
                'creator:id,name,email',
                'assignee:id,name,email',
                'category:id,name',
                'priority:id,name',
                'status:id,name',
            ])
            ->findOrFail($id);

        return response()->json([
            'ticket' => $ticket,
        ]);
    }

    /**
     * Update ticket assignment, status, or priority
     * and record every actual change.
     */
    public function update(
        Request $request,
        string $id
    ): JsonResponse {
        $ticket = Ticket::with([
            'assignee:id,name',
            'priority:id,name',
            'status:id,name',
        ])->findOrFail($id);

        $validated = $request->validate([
            'assigned_to' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'status_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:ticket_statuses,id',
            ],
            'priority_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:ticket_priorities,id',
            ],
        ]);

        DB::transaction(function () use (
            $request,
            $ticket,
            $validated
        ): void {
            $oldAssignedId = $ticket->assigned_to;
            $oldAssigneeName = $ticket->assignee?->name;

            $oldStatusId = $ticket->status_id;
            $oldStatusName = $ticket->status?->name;

            $oldPriorityId = $ticket->priority_id;
            $oldPriorityName = $ticket->priority?->name;

            $ticket->update($validated);

            $ticket->load([
                'assignee:id,name',
                'priority:id,name',
                'status:id,name',
            ]);

            if (
                array_key_exists('assigned_to', $validated) &&
                (int) $oldAssignedId !==
                    (int) $ticket->assigned_to
            ) {
                $oldName = $oldAssigneeName ?? 'Unassigned';
                $newName = $ticket->assignee?->name ?? 'Unassigned';

                $ticket->activities()->create([
                    'user_id' => $request->user()->id,
                    'action' => 'updated',
                    'field' => 'assigned_to',
                    'old_value' => $oldAssignedId,
                    'new_value' => $ticket->assigned_to,
                    'description' =>
                        "Assignment changed from {$oldName} to {$newName}.",
                ]);
            }

            if (
                array_key_exists('status_id', $validated) &&
                (int) $oldStatusId !==
                    (int) $ticket->status_id
            ) {
                $oldName = $oldStatusName ?? 'Unknown';
                $newName = $ticket->status?->name ?? 'Unknown';

                $ticket->activities()->create([
                    'user_id' => $request->user()->id,
                    'action' => 'updated',
                    'field' => 'status_id',
                    'old_value' => $oldStatusId,
                    'new_value' => $ticket->status_id,
                    'description' =>
                        "Status changed from {$oldName} to {$newName}.",
                ]);
            }

            if (
                array_key_exists('priority_id', $validated) &&
                (int) $oldPriorityId !==
                    (int) $ticket->priority_id
            ) {
                $oldName = $oldPriorityName ?? 'Unknown';
                $newName = $ticket->priority?->name ?? 'Unknown';

                $ticket->activities()->create([
                    'user_id' => $request->user()->id,
                    'action' => 'updated',
                    'field' => 'priority_id',
                    'old_value' => $oldPriorityId,
                    'new_value' => $ticket->priority_id,
                    'description' =>
                        "Priority changed from {$oldName} to {$newName}.",
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
            'message' => 'Ticket updated successfully.',
            'ticket' => $ticket,
        ]);
    }
}