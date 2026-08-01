import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl() {
  const configured = process.env.DATABASE_URL || 'file:../data/bee-tv.db';
  // Prisma resolves relative SQLite URLs from prisma/schema.prisma, not the process working directory.
  // Preserve absolute URLs and non-SQLite providers while correcting the historical root-relative default.
  return configured === 'file:./data/bee-tv.db' ? 'file:../data/bee-tv.db' : configured;
}

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => new PrismaClient({ datasources: { db: { url: resolveDatabaseUrl() } } }),
    },
  ],
  exports: [PrismaClient],
})
export class PrismaModule {}
