<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Administrator',
                'password' => 'Admin123!',
                'role' => 'admin',
            ],
        );

        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test Employee',
                'password' => 'password',
                'role' => 'employee',
            ],
        );

        User::updateOrCreate(
            ['email' => 'technician@example.com'],
            [
                'name' => 'Test Technician',
                'password' => 'Tech123!',
                'role' => 'technician',
            ],
        );
    }
}