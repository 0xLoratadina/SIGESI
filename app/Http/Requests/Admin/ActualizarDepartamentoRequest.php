<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarDepartamentoRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:150', Rule::unique('departamentos')->ignore($this->route('departamento'))],
            'codigo' => ['required', 'string', 'max:10', Rule::unique('departamentos')->ignore($this->route('departamento'))],
            'edificio' => ['nullable', 'string', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'jefe' => ['nullable', 'string', 'max:150'],
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
            'nombre.unique' => 'Ya existe un departamento con este nombre.',
            'codigo.required' => 'El código es obligatorio.',
            'codigo.unique' => 'Ya existe un departamento con este código.',
        ];
    }
}
