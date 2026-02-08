<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DepartamentoSeeder::class,
            PrioridadSeeder::class,
            CategoriaSeeder::class,
            UbicacionSeeder::class,
            ConfiguracionSeeder::class,
            UserSeeder::class,
            TicketSeeder::class,
        ]);
    }
}
