import { Module } from '@nestjs/common';
import { AffiliatedModule } from './affiliated.module';

@Module({
  imports: [AffiliatedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
