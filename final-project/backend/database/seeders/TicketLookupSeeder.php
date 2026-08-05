<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TicketLookupSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('ticket_categories')->upsert([
            [
                'name' => 'Hardware',
                'description' => 'Computer, printer, and physical equipment issues',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Software',
                'description' => 'Application and operating system issues',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Network',
                'description' => 'Internet, Wi-Fi, and connectivity issues',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Account',
                'description' => 'Login, password, and user account issues',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Other',
                'description' => 'Issues not covered by another category',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['name'], ['description', 'is_active', 'updated_at']);

        DB::table('ticket_priorities')->upsert([
            [
                'name' => 'Low',
                'level' => 1,
                'color' => '#22C55E',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Medium',
                'level' => 2,
                'color' => '#3B82F6',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'High',
                'level' => 3,
                'color' => '#F59E0B',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Urgent',
                'level' => 4,
                'color' => '#EF4444',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['name'], ['level', 'color', 'is_active', 'updated_at']);

        DB::table('ticket_statuses')->upsert([
            [
                'name' => 'Open',
                'color' => '#3B82F6',
                'sort_order' => 1,
                'is_closed' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Assigned',
                'color' => '#8B5CF6',
                'sort_order' => 2,
                'is_closed' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'In Progress',
                'color' => '#F59E0B',
                'sort_order' => 3,
                'is_closed' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Resolved',
                'color' => '#22C55E',
                'sort_order' => 4,
                'is_closed' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Closed',
                'color' => '#6B7280',
                'sort_order' => 5,
                'is_closed' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['name'], ['color', 'sort_order', 'is_closed', 'is_active', 'updated_at']);
    }
}