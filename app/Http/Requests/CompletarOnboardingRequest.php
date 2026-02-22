<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompletarOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'telefono' => ['required', 'string', 'max:20'],
            'cargo' => ['required', 'string', 'max:100'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'ubicacion_id' => ['nullable', 'integer', 'exists:ubicaciones,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre completo es obligatorio.',
            'telefono.required' => 'El teléfono es obligatorio.',
            'cargo.required' => 'El cargo es obligatorio.',
            'area_id.required' => 'El área es obligatorio.',
            'area_id.exists' => 'El área seleccionado no es válido.',
            'ubicacion_id.exists' => 'La ubicación seleccionada no es válida.',
        ];
    }
}
