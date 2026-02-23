<?php

namespace App\Http\Requests;

use App\Enums\EstadoTicket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarTicketRequest extends FormRequest
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
            'estado' => ['sometimes', Rule::enum(EstadoTicket::class)],
            'prioridad_id' => ['sometimes', 'integer', 'exists:prioridades,id'],
            'auxiliar_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'estado.Illuminate\Validation\Rules\Enum' => 'El estado seleccionado no es válido.',
            'prioridad_id.exists' => 'La prioridad seleccionada no es válida.',
            'auxiliar_id.exists' => 'El auxiliar seleccionado no es válido.',
        ];
    }
}
