import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class AzureBlobService implements OnModuleInit {
    private blobServiceClient: BlobServiceClient;
    private readonly logger = new Logger(AzureBlobService.name);

    // product-images 컨테이너 접근을 위한 변수
    private publicContainer : ContainerClient;

    onModuleInit() {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if(!connectionString) {
          throw new Error(`.env 에 AZURE_STORAGE_CONNECTION_STRING 에 넣으세요.`)
      }
      // 업로드 클라이언트를 만든거에요
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const publicName = process.env.AZURE_PUBLIC_CONTAINER ?? 'project-images';
      // 컨테이너를 연결
      this.publicContainer = this.blobServiceClient.getContainerClient(publicName)
    }

    // 저장용 고유 파일명
    makeBlobName(originName: string) {
      const ext = extname(originName).toLowerCase();
      return `${randomUUID()}${ext}`
    }
    
    // product-images 안에 products 가상폴더를 만들고 file 을 업로드
    async uploadPublic(
      file: Express.Multer.File,
      folder = "project"
    ) : Promise<{blobName: string, path: string}>{
      // azure 에 file 을 저장하는 로직
      // products/ 가상폴더
      const blobName = `${folder}/${this.makeBlobName(file.originalname)}`;
      const blockBlob = this.publicContainer.getBlockBlobClient(blobName);
      await blockBlob.uploadData(file.buffer, {
          blobHTTPHeaders: {blobContentType : file.mimetype}
      });
      return {blobName: blobName, path: blockBlob.url }
    }

    // blob image 삭제
    async deletePublic(blobName: string): Promise<void> {
      const blockBlobClient = this.publicContainer.getBlockBlobClient(blobName);
      const deleteResponse = await blockBlobClient.deleteIfExists();

      if (!deleteResponse.succeeded) {
        this.logger.warn(`Blob 삭제 실패 또는 존재하지 않음: ${blobName}`);
      }
    }
}