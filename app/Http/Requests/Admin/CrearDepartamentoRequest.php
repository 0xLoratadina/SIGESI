<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CrearDepartamentoRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:150', 'unique:departamentos,nombre'],
            'codigo' => ['required', 'string', 'max:10', 'unique:departamentos,codigo'],
            'edificio' => ['nullable', 'string', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'jefe' => ['nullable', 'string', 'max:150'],
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
            'nombre.unique' => 'Ya existe un departamento con este nombre.',
            'codigo.required' => 'El código es obligatorio.',
            'codigo.max' => 'El código no puede exceder 10 caracteres.',
            'codigo.unique' => 'Ya existe un departamento con este código.',
        ];
    }
}
