<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminUserCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'max:50'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[^<>]*$/'],
            'business_name' => ['nullable', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'business_address' => ['nullable', 'string', 'max:500', 'regex:/^[^<>]*$/'],
            'vehicle_type' => ['nullable', 'string', 'max:100', 'regex:/^[^<>]*$/'],
            'vehicle_number' => ['nullable', 'string', 'max:50', 'regex:/^[^<>]*$/'],
            'bio' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
            'kshetra_id' => ['nullable', 'integer', 'exists:kshetras,id'],
            'prant_id' => ['nullable', 'integer', 'exists:prants,id'],
            'vibhag_id' => ['nullable', 'integer', 'exists:vibhags,id'],
            'jila_id' => ['nullable', 'integer', 'exists:jilas,id'],
            'nagar_id' => ['nullable', 'integer', 'exists:nagars,id'],
            'shakha_id' => ['nullable', 'integer', 'exists:shakhas,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'The name field cannot contain HTML tag characters like < or >.',
            'business_name.regex' => 'The business name field cannot contain HTML tag characters like < or >.',
            'vehicle_type.regex' => 'The vehicle type field cannot contain HTML tag characters like < or >.',
            'bio.regex' => 'The bio field cannot contain HTML tag characters like < or >.',
        ];
    }
}
