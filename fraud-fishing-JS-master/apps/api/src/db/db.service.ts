// db.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, createPool } from 'mysql2/promise';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.pool = createPool({
      host: this.config.get<string>('DB_HOST'),
      user: this.config.get<string>('DB_USER'),
      password: this.config.get<string>('DB_PASS'),
      database: this.config.get<string>('DB_NAME'),
    });
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
  getPool(): Pool {
    return this.pool;
  }
}
