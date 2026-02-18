<?php

use App\Http\Controllers\Api\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/whatsapp/webhook/{event?}', [WhatsAppWebhookController::class, 'handle'])
    ->where('event', '.*')
    ->name('whatsapp.webhook');
