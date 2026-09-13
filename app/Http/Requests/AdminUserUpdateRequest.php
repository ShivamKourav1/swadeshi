<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('id');

        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId), 'required_without:phone'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'string', 'max:50'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
            'status' => ['required', 'in:active,inactive'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[^<>]*$/', 'required_without:email'],
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
