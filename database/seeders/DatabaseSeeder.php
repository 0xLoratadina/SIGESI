<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ConfiguracionSeeder::class,
            AreaSeeder::class,
            CategoriaSeeder::class,
            PrioridadSeeder::class,
            UbicacionSeeder::class,
            UserSeeder::class,
            TicketSeeder::class,
        ]);
    }
}
