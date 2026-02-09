<?php

namespace App\Http\Requests;

use App\Enums\Canal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CrearTicketRequest extends FormRequest
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
        $reglas = [
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['required', 'string', 'min:10'],
            'departamento_id' => ['required', 'integer', 'exists:departamentos,id'],
            'categoria_id' => ['required', 'integer', 'exists:categorias,id'],
            'prioridad_id' => ['required', 'integer', 'exists:prioridades,id'],
            'ubicacion_id' => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'canal' => ['nullable', Rule::enum(Canal::class)],
        ];

        if ($this->user()->esAdmin()) {
            $reglas['solicitante_id'] = ['required', 'integer', 'exists:users,id'];
        }

        return $reglas;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'titulo.required' => 'El título es obligatorio.',
            'titulo.max' => 'El título no puede exceder 255 caracteres.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'descripcion.min' => 'La descripción debe tener al menos 10 caracteres.',
            'departamento_id.required' => 'El departamento es obligatorio.',
            'departamento_id.exists' => 'El departamento seleccionado no es válido.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.exists' => 'La categoría seleccionada no es válida.',
            'prioridad_id.required' => 'La prioridad es obligatoria.',
            'prioridad_id.exists' => 'La prioridad seleccionada no es válida.',
            'ubicacion_id.exists' => 'La ubicación seleccionada no es válida.',
            'solicitante_id.required' => 'El solicitante es obligatorio.',
            'solicitante_id.exists' => 'El solicitante seleccionado no es válido.',
        ];
    }
}
