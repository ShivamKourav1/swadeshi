<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeliveryStatusUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->isDeliveryPartner() || $this->user()->isAdmin());
    }

    public function rules(): array
    {
        return [
            'delivery_status' => ['required', 'string', 'in:dispatched,in_transit,delivered'],
            'mark_completed' => ['nullable', 'boolean'],
            'payment_collected' => ['nullable', 'boolean'],
            'amount_collected' => ['nullable', 'numeric', 'min:0'],
            'screenshot_url' => ['nullable', 'string', 'url'],
            'notes' => ['nullable', 'string', 'max:500', 'regex:/^[^<>]*$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'notes.regex' => 'Fulfillment notes cannot contain HTML tag symbols like < or >.',
            'screenshot_url.url' => 'Screenshot URL must be a valid HTTP or HTTPS link.',
        ];
    }
}
