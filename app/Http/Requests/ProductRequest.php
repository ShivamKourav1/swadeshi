<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->isDealer() || $this->user()->isAdmin());
    }

    public function rules(): array
    {
        $productId = $this->product ? $this->product->id : null;

        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required', 'numeric', 'min:0.01'],
            'stock' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'regex:/^[^<>]*$/'],
            'sku' => ['required', 'string', 'max:100', 'regex:/^[^<>]*$/', 'unique:products,sku,' . $productId],
            'image_url' => ['nullable', 'string', 'url'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'The product name cannot contain HTML tag symbols like < or >.',
            'description.regex' => 'The product description cannot contain HTML tag symbols like < or >.',
            'sku.regex' => 'The SKU cannot contain HTML tag symbols like < or >.',
        ];
    }
}
