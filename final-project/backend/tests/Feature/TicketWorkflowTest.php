<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\User;
use Database\Seeders\TicketLookupSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $employee;
    private User $admin;
    private User $technician;
    private Ticket $ticket;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TicketLookupSeeder::class);
        $this->employee = User::factory()->create(['role' => 'employee']);
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->technician = User::factory()->create(['role' => 'technician']);
        $this->ticket = Ticket::create([
            'ticket_number' => 'TKT-WORKFLOW',
            'subject' => 'Workflow test',
            'description' => 'Verify assignment and controlled transitions.',
            'created_by' => $this->employee->id,
            'category_id' => TicketCategory::first()->id,
            'priority_id' => TicketPriority::where('name', 'Medium')->first()->id,
            'status_id' => TicketStatus::where('name', 'Open')->first()->id,
        ]);
    }

    public function test_admin_can_only_assign_a_technician_and_assignment_sets_assigned_status(): void
    {
        $this->actingAs($this->admin, 'api')->putJson("/api/admin/tickets/{$this->ticket->id}", [
            'assigned_to' => $this->employee->id,
        ])->assertUnprocessable();

        $this->actingAs($this->admin, 'api')->putJson("/api/admin/tickets/{$this->ticket->id}", [
            'assigned_to' => $this->technician->id,
        ])->assertOk()->assertJsonPath('ticket.status.name', 'Assigned');

        $this->assertDatabaseHas('ticket_activities', ['ticket_id' => $this->ticket->id, 'field' => 'assigned_to']);
        $this->assertDatabaseHas('ticket_activities', ['ticket_id' => $this->ticket->id, 'field' => 'status_id']);
    }

    public function test_technician_can_follow_workflow_but_cannot_skip_to_closed(): void
    {
        $this->assignTicket();
        $closed = TicketStatus::where('name', 'Closed')->first();
        $progress = TicketStatus::where('name', 'In Progress')->first();
        $resolved = TicketStatus::where('name', 'Resolved')->first();

        $this->actingAs($this->technician, 'api')->putJson("/api/technician/tickets/{$this->ticket->id}/status", [
            'status_id' => $closed->id,
        ])->assertUnprocessable();

        foreach ([$progress, $resolved, $closed] as $status) {
            $this->actingAs($this->technician, 'api')->putJson("/api/technician/tickets/{$this->ticket->id}/status", [
                'status_id' => $status->id,
            ])->assertOk();
        }

        $this->assertNotNull($this->ticket->fresh()->closed_at);
    }

    public function test_internal_notes_are_hidden_from_employee_but_public_replies_are_visible(): void
    {
        $this->assignTicket();
        $this->actingAs($this->technician, 'api')->postJson("/api/tickets/{$this->ticket->id}/comments", [
            'comment' => 'Private diagnostic detail', 'is_internal' => true,
        ])->assertCreated();
        $this->actingAs($this->technician, 'api')->postJson("/api/tickets/{$this->ticket->id}/comments", [
            'comment' => 'We are investigating.', 'is_internal' => false,
        ])->assertCreated();

        $this->actingAs($this->employee, 'api')->getJson("/api/tickets/{$this->ticket->id}/comments")
            ->assertOk()->assertJsonCount(1, 'comments')->assertJsonPath('comments.0.comment', 'We are investigating.');
        $this->actingAs($this->employee, 'api')->postJson("/api/tickets/{$this->ticket->id}/comments", [
            'comment' => 'Attempted note', 'is_internal' => true,
        ])->assertForbidden();
    }

    private function assignTicket(): void
    {
        $this->actingAs($this->admin, 'api')->putJson("/api/admin/tickets/{$this->ticket->id}", [
            'assigned_to' => $this->technician->id,
        ])->assertOk();
        $this->ticket->refresh();
    }
}
