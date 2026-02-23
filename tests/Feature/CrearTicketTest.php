<?php

use App\Enums\EstadoTicket;
use App\Models\Adjunto;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('invitados no pueden crear tickets', function () {
    $this->post(route('tickets.store'))->assertRedirect(route('login'));
});

test('validacion rechaza datos incompletos para auxiliar', function () {
    $this->actingAs(User::factory()->auxiliar()->create());

    $this->post(route('tickets.store'), [])
        ->assertSessionHasErrors(['titulo', 'descripcion', 'area_id', 'categoria_id', 'prioridad_id']);
});

test('solicitante solo requiere titulo y descripcion', function () {
    $area = Area::factory()->create();
    Categoria::factory()->create();
    Prioridad::factory()->create();
    $usuario = User::factory()->solicitante()->create(['area_id' => $area->id]);

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Mi problema',
        'descripcion' => 'Descripcion detallada de al menos diez caracteres',
    ])->assertRedirect(route('dashboard'));
});

test('solicitante recibe valores por defecto para area categoria y prioridad', function () {
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $usuario = User::factory()->solicitante()->create(['area_id' => $area->id]);

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Ticket simplificado',
        'descripcion' => 'Solo titulo y descripcion sin campos tecnicos',
    ])->assertRedirect(route('dashboard'));

    $ticket = Ticket::first();
    expect($ticket)
        ->area_id->toBe($area->id)
        ->categoria_id->toBe($categoria->id)
        ->prioridad_id->toBe($prioridad->id);
});

test('titulo no puede exceder 255 caracteres', function () {
    $this->actingAs(User::factory()->auxiliar()->create());

    $this->post(route('tickets.store'), [
        'titulo' => str_repeat('a', 256),
        'descripcion' => 'Descripcion valida del problema',
        'area_id' => Area::factory()->create()->id,
        'categoria_id' => Categoria::factory()->create()->id,
        'prioridad_id' => Prioridad::factory()->create()->id,
    ])->assertSessionHasErrors('titulo');
});

test('descripcion debe tener al menos 10 caracteres', function () {
    $this->actingAs(User::factory()->auxiliar()->create());

    $this->post(route('tickets.store'), [
        'titulo' => 'Titulo valido',
        'descripcion' => 'Corta',
        'area_id' => Area::factory()->create()->id,
        'categoria_id' => Categoria::factory()->create()->id,
        'prioridad_id' => Prioridad::factory()->create()->id,
    ])->assertSessionHasErrors('descripcion');
});

test('solicitante puede crear un ticket', function () {
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $usuario = User::factory()->solicitante()->create(['area_id' => $area->id]);

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'No tengo internet',
        'descripcion' => 'No puedo conectarme a la red desde mi oficina desde esta manana',
    ])->assertRedirect(route('dashboard'));

    $ticket = Ticket::first();
    expect($ticket)
        ->titulo->toBe('No tengo internet')
        ->solicitante_id->toBe($usuario->id)
        ->creador_id->toBe($usuario->id)
        ->estado->toBe(EstadoTicket::Abierto)
        ->numero->toStartWith('TK-');
});

test('auxiliar puede crear un ticket', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($auxiliar);

    $this->post(route('tickets.store'), [
        'titulo' => 'Problema con servidor',
        'descripcion' => 'El servidor de correo esta respondiendo lentamente desde las 8am',
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())
        ->solicitante_id->toBe($auxiliar->id)
        ->creador_id->toBe($auxiliar->id);
});

test('admin puede crear ticket para otro usuario', function () {
    $admin = User::factory()->administrador()->create();
    $solicitante = User::factory()->solicitante()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($admin);

    $this->post(route('tickets.store'), [
        'titulo' => 'Solicitud de software',
        'descripcion' => 'El usuario necesita instalacion de AutoCAD en su equipo de trabajo',
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'solicitante_id' => $solicitante->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())
        ->solicitante_id->toBe($solicitante->id)
        ->creador_id->toBe($admin->id);
});

test('solicitante no puede asignar otro usuario como solicitante', function () {
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $solicitante = User::factory()->solicitante()->create(['area_id' => $area->id]);
    $otroUsuario = User::factory()->create();

    $this->actingAs($solicitante);

    $this->post(route('tickets.store'), [
        'titulo' => 'Mi problema',
        'descripcion' => 'Descripcion detallada del problema que estoy teniendo',
        'solicitante_id' => $otroUsuario->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())->solicitante_id->toBe($solicitante->id);
});

test('numero de ticket se genera automaticamente', function () {
    $usuario = User::factory()->auxiliar()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Primer ticket',
        'descripcion' => 'Descripcion del primer ticket de prueba completa',
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    $this->post(route('tickets.store'), [
        'titulo' => 'Segundo ticket',
        'descripcion' => 'Descripcion del segundo ticket de prueba completa',
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    $tickets = Ticket::orderBy('id')->get();
    expect($tickets[0]->numero)->toBe('TK-0001');
    expect($tickets[1]->numero)->toBe('TK-0002');
});

test('ticket se puede crear con ubicacion', function () {
    $usuario = User::factory()->auxiliar()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $ubicacion = Ubicacion::factory()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Problema en laboratorio',
        'descripcion' => 'Las computadoras del laboratorio no encienden correctamente',
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'ubicacion_id' => $ubicacion->id,
    ])->assertRedirect(route('dashboard'));

    expect(Ticket::first())->ubicacion_id->toBe($ubicacion->id);
});

test('fecha limite se calcula automaticamente de la prioridad', function () {
    $usuario = User::factory()->auxiliar()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create(['horas_resolucion' => 24]);

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Ticket con fecha limite',
        'descripcion' => 'Verificar que la fecha limite se calcule correctamente',
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    expect(Ticket::first()->fecha_limite)->not->toBeNull();
});

test('solicitante puede adjuntar archivos al crear ticket', function () {
    Storage::fake('local');

    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $usuario = User::factory()->solicitante()->create(['area_id' => $area->id]);

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Problema con evidencia',
        'descripcion' => 'Adjunto captura de pantalla del error que aparece',
        'adjuntos' => [
            UploadedFile::fake()->image('error.png'),
            UploadedFile::fake()->create('documento.pdf', 500),
        ],
    ])->assertRedirect(route('dashboard'));

    $ticket = Ticket::first();
    expect(Adjunto::where('ticket_id', $ticket->id)->count())->toBe(2);
});

test('se rechaza mas de 5 adjuntos por ticket', function () {
    $usuario = User::factory()->solicitante()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Demasiados archivos',
        'descripcion' => 'Intento adjuntar mas de 5 archivos al mismo tiempo',
        'adjuntos' => [
            UploadedFile::fake()->image('1.png'),
            UploadedFile::fake()->image('2.png'),
            UploadedFile::fake()->image('3.png'),
            UploadedFile::fake()->image('4.png'),
            UploadedFile::fake()->image('5.png'),
            UploadedFile::fake()->image('6.png'),
        ],
    ])->assertSessionHasErrors('adjuntos');
});

test('se rechaza tipo de archivo no permitido', function () {
    $usuario = User::factory()->solicitante()->create();

    $this->actingAs($usuario);

    $this->post(route('tickets.store'), [
        'titulo' => 'Archivo no permitido',
        'descripcion' => 'Intento adjuntar un archivo ejecutable malicioso',
        'adjuntos' => [
            UploadedFile::fake()->create('script.exe', 100),
        ],
    ])->assertSessionHasErrors('adjuntos.0');
});
