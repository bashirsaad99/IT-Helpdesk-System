<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    public function rules(): array
    {
        return [
            'subject' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'required',
                'string',
                'max:10000',
            ],
            'category_id' => [
                'required',
                'integer',
                Rule::exists('ticket_categories', 'id')
                    ->where('is_active', true),
            ],
            'priority_id' => [
                'required',
                'integer',
                Rule::exists('ticket_priorities', 'id')
                    ->where('is_active', true),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'The ticket subject is required.',
            'subject.max' => 'The ticket subject cannot exceed 255 characters.',
            'description.required' => 'The ticket description is required.',
            'description.max' => 'The ticket description cannot exceed 10,000 characters.',
            'category_id.required' => 'Please select a ticket category.',
            'category_id.exists' => 'The selected category is invalid or inactive.',
            'priority_id.required' => 'Please select a ticket priority.',
            'priority_id.exists' => 'The selected priority is invalid or inactive.',
        ];
    }
}