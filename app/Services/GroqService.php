<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    private string $apiKey;

    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key', '');
        $this->model = config('services.groq.model', 'llama-3.1-8b-instant');
    }

    /**
     * Enviar una solicitud de chat completions a Groq.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array<string, mixed>|null
     */
    public function chat(array $messages, float $temperature = 0.3, bool $jsonMode = true): ?array
    {
        $body = [
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => 1024,
        ];

        if ($jsonMode) {
            $body['response_format'] = ['type' => 'json_object'];
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->withoutVerifying()
                ->timeout(15)
                ->connectTimeout(5)
                ->post('https://api.groq.com/openai/v1/chat/completions', $body);

            if ($response->failed()) {
                Log::channel('whatsapp')->error('Groq API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $content = $response->json('choices.0.message.content');

            if ($jsonMode && $content) {
                return json_decode($content, true);
            }

            return ['content' => $content];
        } catch (\Exception $e) {
            Log::channel('whatsapp')->error('Groq API exception', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
