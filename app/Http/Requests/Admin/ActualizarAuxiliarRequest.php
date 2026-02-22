<?php

namespace App\Http\Requests\Admin;

use App\Enums\Dia;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarAuxiliarRequest extends FormRequest
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
            'whatsapp_telefono' => ['nullable', 'string', 'max:20'],
            'especialidades' => ['nullable', 'string', 'max:500'],
            'disponible' => ['sometimes', 'boolean'],
            'horarios' => ['nullable', 'array'],
            'horarios.*.dia' => ['required_with:horarios', Rule::in(array_column(Dia::cases(), 'value'))],
            'horarios.*.hora_inicio' => ['required_with:horarios', 'date_format:H:i'],
            'horarios.*.hora_fin' => ['required_with:horarios', 'date_format:H:i', 'after:horarios.*.hora_inicio'],
        ];
    }
}
