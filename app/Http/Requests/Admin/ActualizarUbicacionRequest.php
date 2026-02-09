<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarUbicacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->esAdmin();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:150'],
            'edificio' => ['required', 'string', 'max:100'],
            'piso' => ['nullable', 'string', 'max:20'],
            'salon' => ['nullable', 'string', 'max:50'],
            'descripcion' => ['nullable', 'string'],
            'departamento_id' => ['nullable', 'integer', 'exists:departamentos,id'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.max' => 'El nombre no puede exceder 150 caracteres.',
            'departamento_id.exists' => 'El departamento seleccionado no es válido.',
        ];
    }
}
