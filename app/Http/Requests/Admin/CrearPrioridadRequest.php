<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CrearPrioridadRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:50', 'unique:prioridades,nombre'],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'horas_respuesta' => ['required', 'integer', 'min:1'],
            'horas_resolucion' => ['required', 'integer', 'min:1'],
            'nivel' => ['required', 'integer', 'min:1', 'unique:prioridades,nivel'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.unique' => 'Ya existe una prioridad con este nombre.',
            'color.required' => 'El color es obligatorio.',
            'color.regex' => 'El color debe ser un código hexadecimal válido (ej: #FF0000).',
            'horas_respuesta.required' => 'Las horas de respuesta son obligatorias.',
            'horas_respuesta.min' => 'Las horas de respuesta deben ser al menos 1.',
            'horas_resolucion.required' => 'Las horas de resolución son obligatorias.',
            'horas_resolucion.min' => 'Las horas de resolución deben ser al menos 1.',
            'nivel.required' => 'El nivel es obligatorio.',
            'nivel.unique' => 'Ya existe una prioridad con este nivel.',
        ];
    }
}
