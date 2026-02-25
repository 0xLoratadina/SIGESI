<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        $esSolicitante = $this->user()->esSolicitante();

        $reglas = [
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['required', 'string', 'min:10'],
            'adjuntos' => ['nullable', 'array', 'max:5'],
            'adjuntos.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,mp4,mov'],
        ];

        if (! $esSolicitante) {
            $reglas['area_id'] = ['required', 'integer', 'exists:areas,id'];
            $reglas['categoria_id'] = ['nullable', 'integer', 'exists:categorias,id'];
            $reglas['prioridad_id'] = ['nullable', 'integer', 'exists:prioridades,id'];
        }

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
            'area_id.required' => 'El área es obligatoria.',
            'area_id.exists' => 'El área seleccionada no es válida.',
            'categoria_id.exists' => 'La categoría seleccionada no es válida.',
            'prioridad_id.exists' => 'La prioridad seleccionada no es válida.',
            'solicitante_id.required' => 'El solicitante es obligatorio.',
            'solicitante_id.exists' => 'El solicitante seleccionado no es válido.',
            'adjuntos.max' => 'Máximo 5 archivos por ticket.',
            'adjuntos.*.max' => 'Cada archivo no debe exceder 10 MB.',
            'adjuntos.*.mimes' => 'Tipo de archivo no permitido.',
        ];
    }
}
