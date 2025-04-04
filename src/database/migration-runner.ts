// src/database/migration-runner.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load .env file
config();

const source = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*.js'],
});

async function runMigrations() {
  try {
    await source.initialize();
    console.log('Data Source has been initialized!');

    await source.runMigrations();
    console.log('Migrations have been run successfully');

    await source.destroy();
  } catch (err) {
    console.error('Error during Data Source initialization', err);
    process.exit(1);
  }
}

runMigrations();