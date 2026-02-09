<?php

use App\Http\Controllers\Admin\CatalogosController;
use App\Http\Controllers\Admin\CategoriaController;
use App\Http\Controllers\Admin\DepartamentoController;
use App\Http\Controllers\Admin\PrioridadController;
use App\Http\Controllers\Admin\UbicacionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::post('tickets', [TicketController::class, 'store'])->name('tickets.store');
});

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->group(function () {
    Route::get('catalogos', CatalogosController::class)->name('admin.catalogos');

    Route::post('departamentos', [DepartamentoController::class, 'store'])->name('admin.departamentos.store');
    Route::put('departamentos/{departamento}', [DepartamentoController::class, 'update'])->name('admin.departamentos.update');
    Route::delete('departamentos/{departamento}', [DepartamentoController::class, 'destroy'])->name('admin.departamentos.destroy');

    Route::post('categorias', [CategoriaController::class, 'store'])->name('admin.categorias.store');
    Route::put('categorias/{categoria}', [CategoriaController::class, 'update'])->name('admin.categorias.update');
    Route::delete('categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('admin.categorias.destroy');

    Route::post('prioridades', [PrioridadController::class, 'store'])->name('admin.prioridades.store');
    Route::put('prioridades/{prioridad}', [PrioridadController::class, 'update'])->name('admin.prioridades.update');
    Route::delete('prioridades/{prioridad}', [PrioridadController::class, 'destroy'])->name('admin.prioridades.destroy');

    Route::post('ubicaciones', [UbicacionController::class, 'store'])->name('admin.ubicaciones.store');
    Route::put('ubicaciones/{ubicacion}', [UbicacionController::class, 'update'])->name('admin.ubicaciones.update');
    Route::delete('ubicaciones/{ubicacion}', [UbicacionController::class, 'destroy'])->name('admin.ubicaciones.destroy');
});

require __DIR__.'/settings.php';
