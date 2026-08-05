<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->string('subject');
            $table->text('description');

            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignId('category_id')
                ->constrained('ticket_categories')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('priority_id')
                ->constrained('ticket_priorities')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('status_id')
                ->constrained('ticket_statuses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['created_by', 'status_id']);
            $table->index(['assigned_to', 'status_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};