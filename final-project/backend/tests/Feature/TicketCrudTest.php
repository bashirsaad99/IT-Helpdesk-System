<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $employee;
    private TicketCategory $category;
    private TicketPriority $priority;
    private TicketStatus $status;

    protected function setUp(): void
    {
        parent::setUp();

        $this->employee = User::factory()->create(['role' => 'employee']);
        $this->category = TicketCategory::create([
            'name' => 'Hardware',
            'is_active' => true,
        ]);
        $this->priority = TicketPriority::create([
            'name' => 'Medium',
            'level' => 2,
            'is_active' => true,
        ]);
        $this->status = TicketStatus::create([
            'name' => 'Open',
            'sort_order' => 1,
            'is_closed' => false,
            'is_active' => true,
        ]);
    }

    public function test_employee_can_create_read_update_and_delete_own_ticket(): void
    {
        $createResponse = $this->actingAs($this->employee, 'api')->postJson(
            '/api/tickets',
            [
                'subject' => 'Printer unavailable',
                'description' => 'The office printer is offline.',
                'category_id' => $this->category->id,
                'priority_id' => $this->priority->id,
            ],
        );

        $createResponse->assertCreated()
            ->assertJsonPath('ticket.subject', 'Printer unavailable');

        $ticketId = $createResponse->json('ticket.id');

        $this->actingAs($this->employee, 'api')
            ->getJson("/api/tickets/{$ticketId}")
            ->assertOk()
            ->assertJsonPath('ticket.id', $ticketId);

        $this->actingAs($this->employee, 'api')
            ->putJson("/api/tickets/{$ticketId}", [
                'subject' => 'Printer still unavailable',
            ])
            ->assertOk()
            ->assertJsonPath('ticket.subject', 'Printer still unavailable');

        $this->actingAs($this->employee, 'api')
            ->deleteJson("/api/tickets/{$ticketId}")
            ->assertOk()
            ->assertJsonPath('message', 'Ticket deleted successfully.');

        $this->assertDatabaseMissing('tickets', ['id' => $ticketId]);
    }

    public function test_employee_cannot_read_update_or_delete_another_employees_ticket(): void
    {
        $otherEmployee = User::factory()->create(['role' => 'employee']);
        $ticket = $this->createTicketFor($otherEmployee);

        $this->actingAs($this->employee, 'api')
            ->getJson("/api/tickets/{$ticket->id}")
            ->assertNotFound();

        $this->actingAs($this->employee, 'api')
            ->putJson("/api/tickets/{$ticket->id}", ['subject' => 'Changed'])
            ->assertNotFound();

        $this->actingAs($this->employee, 'api')
            ->deleteJson("/api/tickets/{$ticket->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('tickets', ['id' => $ticket->id]);
    }

    public function test_technician_cannot_use_employee_crud_routes(): void
    {
        $technician = User::factory()->create(['role' => 'technician']);

        $this->actingAs($technician, 'api')
            ->postJson('/api/tickets', [
                'subject' => 'Unauthorized ticket',
                'description' => 'This request must be rejected.',
                'category_id' => $this->category->id,
                'priority_id' => $this->priority->id,
            ])
            ->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_ticket_crud(): void
    {
        $this->getJson('/api/tickets')->assertUnauthorized();
        $this->postJson('/api/tickets', [])->assertUnauthorized();
    }

    private function createTicketFor(User $user): Ticket
    {
        return Ticket::create([
            'ticket_number' => 'TKT-TEST-' . $user->id,
            'subject' => 'Private ticket',
            'description' => 'Only its creator may modify this ticket.',
            'created_by' => $user->id,
            'assigned_to' => null,
            'category_id' => $this->category->id,
            'priority_id' => $this->priority->id,
            'status_id' => $this->status->id,
        ]);
    }
}
