<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'delivery_location_id' => ['required', 'exists:delivery_locations,id'],
            'payment_method' => ['required', 'string', 'in:cod,stripe,paypal'],
            'notes' => ['nullable', 'string', 'max:500', 'regex:/^[^<>]*$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'notes.regex' => 'Order notes cannot contain HTML tag symbols like < or >.',
        ];
    }
}
