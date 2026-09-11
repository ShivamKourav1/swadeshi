<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeliveryLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:50', 'regex:/^[^<>]*$/'],
            'recipient_name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'phone' => ['required', 'string', 'max:20', 'regex:/^[^<>]*$/'],
            'address_line_1' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'address_line_2' => ['nullable', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'city' => ['required', 'string', 'max:100', 'regex:/^[^<>]*$/'],
            'state' => ['required', 'string', 'max:100', 'regex:/^[^<>]*$/'],
            'postal_code' => ['required', 'string', 'max:20', 'regex:/^[^<>]*$/'],
            'country' => ['required', 'string', 'max:100', 'regex:/^[^<>]*$/'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['nullable', 'boolean'],
            'kshetra_id' => ['nullable', 'exists:kshetras,id'],
            'prant_id' => ['nullable', 'exists:prants,id'],
            'vibhag_id' => ['nullable', 'exists:vibhags,id'],
            'jila_id' => ['nullable', 'exists:jilas,id'],
            'nagar_id' => ['nullable', 'exists:nagars,id'],
            'shakha_id' => ['nullable', 'exists:shakhas,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_name.regex' => 'Recipient name cannot contain special characters like < or >.',
            'address_line_1.regex' => 'Address line cannot contain special characters like < or >.',
        ];
    }
}
