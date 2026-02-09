<?php

use App\Enums\Canal;
use App\Enums\EstadoTicket;
use App\Models\Categoria;
use App\Models\Departamento;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;

test('invitados no pueden crear tickets', function () {
    $this->post(route('tickets.store'))->assertRedirect(route('login'));
});

test('validacion rechaza datos incompletos', function () {
    $this->actingAs(User::factory()->create());

    $this->post(route('tickets.store'), [])
        ->assertSessionHasErrors(['titulo', 'descripcion', 'departamento_id', 'categoria_id', 'prioridad_id']);
});

test('titulo no puede exceder 255 caracteres', function () {
    $this->actingAs(User::factory()->create());

    $this->post(route('tickets.store'), [
        'titulo' => str_repeat('a', 256),
        'descripcion' => 'Descripcion valida del problema',
        'departamento_id' => Departamento::factory()->create()->id,
        'categoria_id' => Categoria::factory()->create()->id,
        'prioridad_id' => Prioridad::factory()->create()->id,
    ])->assertSessionHasErrors('titulo');
});

test('descripcion debe tener al menos 10 caracteres', function () {
    $this->actingAs(User::factory()->create());

    $this->post(route('tickets.store'), [
        'titulo' => 'Titulo valido',
        'descripcion' => 'Corta',
        'departamento_id' => Departamento::factory()->create()->id,
        'categoria_id' => Categoria::factory()->create()->id,
        'prioridad_id' => Prioridad::factory()->create()->id,
    ])->assertSessionHasErrors('descripcion');
});

test('solicitante puede crear un ticket', function () {
    $usuario = User::factory()->solicitante()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'No tengo internet',
        'descripcion' => 'No puedo conectarme a la red desde mi oficina desde esta manana',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'canal' => Canal::Web->value,
    ])->assertRedirect(route('dashboard'));

    $ticket = Ticket::first();
    expect($ticket)
        ->titulo->toBe('No tengo internet')
        ->solicitante_id->toBe($usuario->id)
        ->creador_id->toBe($usuario->id)
        ->estado->toBe(EstadoTicket::Abierto)
        ->numero->toStartWith('TK-');
});

test('tecnico puede crear un ticket', function () {
    $tecnico = User::factory()->tecnico()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($tecnico);

    $this->post(route('tickets.store'), [
        'titulo' => 'Problema con servidor',
        'descripcion' => 'El servidor de correo esta respondiendo lentamente desde las 8am',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())
        ->solicitante_id->toBe($tecnico->id)
        ->creador_id->toBe($tecnico->id);
});

test('admin puede crear ticket para otro usuario', function () {
    $admin = User::factory()->administrador()->create();
    $solicitante = User::factory()->solicitante()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($admin);

    $this->post(route('tickets.store'), [
        'titulo' => 'Solicitud de software',
        'descripcion' => 'El usuario necesita instalacion de AutoCAD en su equipo de trabajo',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'solicitante_id' => $solicitante->id,
        'canal' => Canal::Presencial->value,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())
        ->solicitante_id->toBe($solicitante->id)
        ->creador_id->toBe($admin->id)
        ->canal->toBe(Canal::Presencial);
});

test('solicitante no puede asignar otro usuario como solicitante', function () {
    $solicitante = User::factory()->solicitante()->create();
    $otroUsuario = User::factory()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($solicitante);

    $this->post(route('tickets.store'), [
        'titulo' => 'Mi problema',
        'descripcion' => 'Descripcion detallada del problema que estoy teniendo',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'solicitante_id' => $otroUsuario->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())->solicitante_id->toBe($solicitante->id);
});

test('numero de ticket se genera automaticamente', function () {
    $usuario = User::factory()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Primer ticket',
        'descripcion' => 'Descripcion del primer ticket de prueba completa',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    $this->post(route('tickets.store'), [
        'titulo' => 'Segundo ticket',
        'descripcion' => 'Descripcion del segundo ticket de prueba completa',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    $tickets = Ticket::orderBy('id')->get();
    expect($tickets[0]->numero)->toBe('TK-0001');
    expect($tickets[1]->numero)->toBe('TK-0002');
});

test('ticket se puede crear con ubicacion', function () {
    $usuario = User::factory()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $ubicacion = Ubicacion::factory()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Problema en laboratorio',
        'descripcion' => 'Las computadoras del laboratorio no encienden correctamente',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'ubicacion_id' => $ubicacion->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())->ubicacion_id->toBe($ubicacion->id);
});

test('canal por defecto es Web si no se especifica', function () {
    $usuario = User::factory()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Problema de red',
        'descripcion' => 'La red inalambrica del edificio principal esta muy lenta',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())->canal->toBe(Canal::Web);
});

test('fecha limite se calcula automaticamente de la prioridad', function () {
    $usuario = User::factory()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create(['horas_resolucion' => 24]);

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Ticket con fecha limite',
        'descripcion' => 'Verificar que la fecha limite se calcule correctamente',
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    expect(Ticket::first()->fecha_limite)->not->toBeNull();
});
