import { Global, Module } from '@nestjs/common';
import { R2Adapter } from './r2.adapter';
import { STORAGE_ADAPTER } from './storage.interface';

@Global()
@Module({
  providers: [{ provide: STORAGE_ADAPTER, useClass: R2Adapter }],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}
