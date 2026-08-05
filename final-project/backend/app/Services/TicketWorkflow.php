<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketStatus;
use Illuminate\Validation\ValidationException;

class TicketWorkflow
{
    private const TRANSITIONS = [
        'Open' => ['Assigned'],
        'Assigned' => ['In Progress', 'Open'],
        'In Progress' => ['Resolved', 'Assigned'],
        'Resolved' => ['Closed', 'In Progress'],
        'Closed' => [],
    ];

    public function changeStatus(Ticket $ticket, TicketStatus $newStatus): void
    {
        $ticket->loadMissing('status');
        $currentName = $ticket->status?->name;

        if ($currentName === $newStatus->name) {
            return;
        }

        if (! in_array($newStatus->name, self::TRANSITIONS[$currentName] ?? [], true)) {
            throw ValidationException::withMessages([
                'status_id' => "Status cannot change from {$currentName} to {$newStatus->name}.",
            ]);
        }

        if ($newStatus->name !== 'Open' && ! $ticket->assigned_to) {
            throw ValidationException::withMessages([
                'assigned_to' => 'Assign the ticket to a technician before changing its status.',
            ]);
        }

        $ticket->status_id = $newStatus->id;
        if ($newStatus->name === 'Resolved') {
            $ticket->resolved_at = now();
            $ticket->closed_at = null;
        } elseif ($newStatus->name === 'Closed') {
            $ticket->resolved_at ??= now();
            $ticket->closed_at = now();
        } else {
            $ticket->resolved_at = null;
            $ticket->closed_at = null;
        }
    }

    public function availableAfter(Ticket $ticket)
    {
        $ticket->loadMissing('status');
        $names = self::TRANSITIONS[$ticket->status?->name] ?? [];

        return TicketStatus::query()
            ->where('is_active', true)
            ->whereIn('name', $names)
            ->orderBy('sort_order')
            ->get(['id', 'name']);
    }
}
