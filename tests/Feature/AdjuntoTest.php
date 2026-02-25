<?php

use App\Models\Adjunto;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

function crearAdjuntoConTicket(array $atributosTicket = []): Adjunto
{
    $ticket = Ticket::factory()->create([
        'area_id' => Area::factory(),
        'categoria_id' => Categoria::factory(),
        'prioridad_id' => Prioridad::factory(),
        ...$atributosTicket,
    ]);

    Storage::disk('local')->put('adjuntos/test.jpg', 'contenido-fake');

    return Adjunto::factory()->create([
        'ticket_id' => $ticket->id,
        'usuario_id' => $ticket->solicitante_id,
        'ruta' => 'adjuntos/test.jpg',
        'tipo_mime' => 'image/jpeg',
        'nombre' => 'foto.jpg',
    ]);
}

test('invitados no pueden acceder a adjuntos', function () {
    $adjunto = crearAdjuntoConTicket();

    $this->get(route('adjuntos.show', $adjunto))->assertRedirect(route('login'));
});

test('admin puede acceder a adjunto de cualquier ticket', function () {
    $admin = User::factory()->administrador()->create();
    $adjunto = crearAdjuntoConTicket();

    $this->actingAs($admin);

    $this->get(route('adjuntos.show', $adjunto))
        ->assertSuccessful()
        ->assertHeader('content-type', 'image/jpeg');
});

test('solicitante puede acceder a adjunto de su ticket', function () {
    $solicitante = User::factory()->solicitante()->create();
    $adjunto = crearAdjuntoConTicket(['solicitante_id' => $solicitante->id]);

    $this->actingAs($solicitante);

    $this->get(route('adjuntos.show', $adjunto))
        ->assertSuccessful()
        ->assertHeader('content-type', 'image/jpeg');
});

test('solicitante no puede acceder a adjunto de ticket ajeno', function () {
    $solicitante = User::factory()->solicitante()->create();
    $adjunto = crearAdjuntoConTicket();

    $this->actingAs($solicitante);

    $this->get(route('adjuntos.show', $adjunto))->assertForbidden();
});

test('auxiliar puede acceder a adjunto de ticket asignado', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $adjunto = crearAdjuntoConTicket(['auxiliar_id' => $auxiliar->id]);

    $this->actingAs($auxiliar);

    $this->get(route('adjuntos.show', $adjunto))
        ->assertSuccessful()
        ->assertHeader('content-type', 'image/jpeg');
});

test('auxiliar no puede acceder a adjunto de ticket no asignado', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $adjunto = crearAdjuntoConTicket();

    $this->actingAs($auxiliar);

    $this->get(route('adjuntos.show', $adjunto))->assertForbidden();
});

test('respuesta incluye content-type y nombre correctos', function () {
    $admin = User::factory()->administrador()->create();

    Storage::disk('local')->put('adjuntos/doc.pdf', 'contenido-pdf');

    $ticket = Ticket::factory()->create([
        'area_id' => Area::factory(),
        'categoria_id' => Categoria::factory(),
        'prioridad_id' => Prioridad::factory(),
    ]);

    $adjunto = Adjunto::factory()->create([
        'ticket_id' => $ticket->id,
        'usuario_id' => $ticket->solicitante_id,
        'ruta' => 'adjuntos/doc.pdf',
        'tipo_mime' => 'application/pdf',
        'nombre' => 'reporte.pdf',
    ]);

    $this->actingAs($admin);

    $respuesta = $this->get(route('adjuntos.show', $adjunto));

    $respuesta->assertSuccessful();
    $respuesta->assertHeader('content-type', 'application/pdf');
    expect($respuesta->headers->get('content-disposition'))->toContain('reporte.pdf');
});

test('archivo inexistente en storage devuelve 404', function () {
    $admin = User::factory()->administrador()->create();

    $ticket = Ticket::factory()->create([
        'area_id' => Area::factory(),
        'categoria_id' => Categoria::factory(),
        'prioridad_id' => Prioridad::factory(),
    ]);

    $adjunto = Adjunto::factory()->create([
        'ticket_id' => $ticket->id,
        'usuario_id' => $ticket->solicitante_id,
        'ruta' => 'adjuntos/no-existe.pdf',
        'tipo_mime' => 'application/pdf',
    ]);

    $this->actingAs($admin);

    $this->get(route('adjuntos.show', $adjunto))->assertNotFound();
});
