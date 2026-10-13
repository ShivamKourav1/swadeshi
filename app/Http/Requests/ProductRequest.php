<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->isDealer() || $this->user()->isAdmin());
    }

    public function rules(): array
    {
        $product = $this->route('product');
        $productId = $product instanceof Product ? $product->id : ($product ?: ($this->product instanceof Product ? $this->product->id : null));

        $skuRule = Rule::unique('products', 'sku');
        if (!empty($productId)) {
            $skuRule->ignore($productId);
        }

        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required', 'numeric', 'min:0.01'],
            'stock' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'regex:/^[^<>]*$/'],
            'sku' => ['required', 'string', 'max:100', 'regex:/^[^<>]*$/', $skuRule],
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
