<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketActivityController extends Controller
{
    /**
     * Display the activity history for an authorized ticket.
     */
    public function index(
        Request $request,
        string $ticketId
    ): JsonResponse {
        $user = $request->user();

        $ticketQuery = Ticket::query();

        if ($user->role === 'employee') {
            $ticketQuery->where('created_by', $user->id);
        } elseif ($user->role === 'technician') {
            $ticketQuery->where('assigned_to', $user->id);
        } elseif ($user->role !== 'admin') {
            abort(403, 'You are not authorized to view this ticket.');
        }

        $ticket = $ticketQuery->findOrFail($ticketId);

        $activities = $ticket->activities()
            ->with('user:id,name,email,role')
            ->oldest()
            ->get();

        return response()->json([
            'activities' => $activities,
        ]);
    }
}