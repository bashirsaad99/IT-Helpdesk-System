<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminOptionsController extends Controller
{
    /**
     * Return the options needed to manage tickets.
     */
    public function index(): JsonResponse
    {
        $technicians = User::query()
            ->where('role', 'technician')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $statuses = TicketStatus::query()
            ->orderBy('id')
            ->get(['id', 'name']);

        $priorities = TicketPriority::query()
            ->orderBy('id')
            ->get(['id', 'name']);

        return response()->json([
            'technicians' => $technicians,
            'statuses' => $statuses,
            'priorities' => $priorities,
        ]);
    }
}