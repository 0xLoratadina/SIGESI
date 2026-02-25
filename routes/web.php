<?php

use App\Http\Controllers\AdjuntoController;
use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\Admin\AuxiliarController;
use App\Http\Controllers\Admin\CatalogosController;
use App\Http\Controllers\Admin\CategoriaController;
use App\Http\Controllers\Admin\PrioridadController;
use App\Http\Controllers\Admin\UbicacionController;
use App\Http\Controllers\Admin\UsuarioController;
use App\Http\Controllers\Admin\WhatsAppController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

// Onboarding (auth, sin verified ni onboarding)
Route::middleware(['auth'])->prefix('onboarding')->group(function () {
    Route::get('/', [OnboardingController::class, 'index'])->name('onboarding.index');
    Route::put('password', [OnboardingController::class, 'cambiarPassword'])->name('onboarding.cambiar-password');
    Route::post('completar', [OnboardingController::class, 'completar'])->name('onboarding.completar');
});

Route::middleware(['auth', 'verified', 'onboarding'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('tickets.show');
    Route::put('tickets/{ticket}', [TicketController::class, 'update'])->name('tickets.update');
    Route::post('tickets', [TicketController::class, 'store'])->name('tickets.store');
    Route::get('adjuntos/{adjunto}', [AdjuntoController::class, 'show'])->name('adjuntos.show');
});

Route::middleware(['auth', 'verified', 'onboarding', 'admin'])->prefix('admin')->group(function () {
    Route::get('catalogos', CatalogosController::class)->name('admin.catalogos');

    Route::post('areas', [AreaController::class, 'store'])->name('admin.areas.store');
    Route::put('areas/{area}', [AreaController::class, 'update'])->name('admin.areas.update');
    Route::delete('areas/{area}', [AreaController::class, 'destroy'])->name('admin.areas.destroy');

    Route::put('auxiliares/{user}', [AuxiliarController::class, 'update'])->name('admin.auxiliares.update');

    Route::post('categorias', [CategoriaController::class, 'store'])->name('admin.categorias.store');
    Route::put('categorias/{categoria}', [CategoriaController::class, 'update'])->name('admin.categorias.update');
    Route::delete('categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('admin.categorias.destroy');

    Route::post('prioridades', [PrioridadController::class, 'store'])->name('admin.prioridades.store');
    Route::put('prioridades/{prioridad}', [PrioridadController::class, 'update'])->name('admin.prioridades.update');
    Route::delete('prioridades/{prioridad}', [PrioridadController::class, 'destroy'])->name('admin.prioridades.destroy');

    Route::post('ubicaciones', [UbicacionController::class, 'store'])->name('admin.ubicaciones.store');
    Route::put('ubicaciones/{ubicacion}', [UbicacionController::class, 'update'])->name('admin.ubicaciones.update');
    Route::delete('ubicaciones/{ubicacion}', [UbicacionController::class, 'destroy'])->name('admin.ubicaciones.destroy');

    Route::get('usuarios', [UsuarioController::class, 'index'])->name('admin.usuarios');
    Route::post('usuarios', [UsuarioController::class, 'store'])->name('admin.usuarios.store');
    Route::put('usuarios/{user}', [UsuarioController::class, 'update'])->name('admin.usuarios.update');
    Route::delete('usuarios/{user}', [UsuarioController::class, 'destroy'])->name('admin.usuarios.destroy');
    Route::delete('usuarios-masivo', [UsuarioController::class, 'destroyMultiple'])->name('admin.usuarios.destroy-multiple');

    Route::get('whatsapp', [WhatsAppController::class, 'index'])->name('admin.whatsapp');
    Route::get('whatsapp/actualizaciones', [WhatsAppController::class, 'actualizaciones'])->name('admin.whatsapp.actualizaciones');
    Route::post('whatsapp/conectar', [WhatsAppController::class, 'conectar'])->name('admin.whatsapp.conectar');
    Route::get('whatsapp/qrcode', [WhatsAppController::class, 'qrcode'])->name('admin.whatsapp.qrcode');
    Route::get('whatsapp/estado', [WhatsAppController::class, 'estado'])->name('admin.whatsapp.estado');
    Route::post('whatsapp/desconectar', [WhatsAppController::class, 'desconectar'])->name('admin.whatsapp.desconectar');
    Route::post('whatsapp/contactos/{contacto}/mensaje', [WhatsAppController::class, 'enviarMensaje'])->name('admin.whatsapp.enviar-mensaje');
    Route::post('whatsapp/contactos/{contacto}/leidos', [WhatsAppController::class, 'marcarLeidos'])->name('admin.whatsapp.marcar-leidos');
    Route::get('whatsapp/contactos', [WhatsAppController::class, 'contactos'])->name('admin.whatsapp.contactos');
    Route::post('whatsapp/sincronizar', [WhatsAppController::class, 'sincronizar'])->name('admin.whatsapp.sincronizar');
    Route::post('whatsapp/nuevo-chat', [WhatsAppController::class, 'nuevoChat'])->name('admin.whatsapp.nuevo-chat');
});

require __DIR__.'/settings.php';
