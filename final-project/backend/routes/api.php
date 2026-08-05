<?php

use App\Http\Controllers\Api\AdminOptionsController;
use App\Http\Controllers\Api\AdminTicketController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TechnicianTicketController;
use App\Http\Controllers\Api\TicketActivityController;
use App\Http\Controllers\Api\TicketCommentController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

/*
|--------------------------------------------------------------------------
| Ticket comments and activity routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->group(function () {
    Route::get('/tickets/{ticketId}/comments', [
        TicketCommentController::class,
        'index',
    ]);

    Route::post('/tickets/{ticketId}/comments', [
        TicketCommentController::class,
        'store',
    ]);

    Route::get('/tickets/{ticketId}/activities', [
        TicketActivityController::class,
        'index',
    ]);
});

/*
|--------------------------------------------------------------------------
| Employee ticket routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api', 'role:employee'])->group(function () {
    Route::apiResource('tickets', TicketController::class);
});

/*
|--------------------------------------------------------------------------
| Administrator routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/test', function () {
            return response()->json([
                'message' => 'Welcome, Admin.',
            ]);
        });

        Route::get('/options', [
            AdminOptionsController::class,
            'index',
        ]);

        Route::get('/tickets', [
            AdminTicketController::class,
            'index',
        ]);

        Route::get('/tickets/{id}', [
            AdminTicketController::class,
            'show',
        ]);

        Route::put('/tickets/{id}', [
            AdminTicketController::class,
            'update',
        ]);
    });

/*
|--------------------------------------------------------------------------
| Technician routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api', 'role:technician'])
    ->prefix('technician')
    ->group(function () {
        Route::get('/tickets', [
            TechnicianTicketController::class,
            'index',
        ]);

        Route::get('/tickets/{id}', [
            TechnicianTicketController::class,
            'show',
        ]);

        Route::put('/tickets/{id}/status', [
            TechnicianTicketController::class,
            'updateStatus',
        ]);

        Route::get('/statuses', [
            TechnicianTicketController::class,
            'statuses',
        ]);
    });

/*
|--------------------------------------------------------------------------
| Employee test route
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api', 'role:employee'])
    ->get('/employee/test', function () {
        return response()->json([
            'message' => 'Welcome, Employee.',
        ]);
    });
