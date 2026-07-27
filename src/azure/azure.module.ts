import { Module } from '@nestjs/common';
import { AzureBlobService } from './azure-blob/azure-blob.service';

@Module({
  providers: [AzureBlobService],
  exports: [AzureBlobService]
})
export class AzureModule {}
