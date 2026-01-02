import { Module } from '@nestjs/common';
import { AffiliatedModule } from './affiliated.module';
import { DbModule } from './db.module';
import { ConfModule } from './conf.module';

@Module({
  imports: [ConfModule, DbModule, AffiliatedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
