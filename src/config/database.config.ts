import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // Ưu tiên sử dụng DATABASE_URL nếu được cung cấp
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: true, // Neon yêu cầu SSL
      entities: ['dist/**/*.entity{.ts,.js}'],
      username: 'social_app_db_owner',
      password: 'npg_Pkzh7J8OcHKG',
      database: 'social_app_db',
      synchronize: process.env.NODE_ENV !== 'production',
      migrations: ['dist/migrations/*.js'],
      migrationsRun: process.env.NODE_ENV === 'production',
    };
  }

  // Fallback sang cấu hình riêng lẻ cho môi trường dev
  return {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    migrations: ['dist/migrations/*.js'],
    migrationsRun: false,
  };
});