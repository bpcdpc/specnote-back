import { Prisma } from '@prisma/client';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

// spec 문서의 타입
export type SpecDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

// 프로젝트 메타 정보 타입
export type SpecInfo = {
  title: string;
  description?: string;
  version: string;
};

// loadSpec() 의 반환 타입
export type SpecResult =
  | { ok: true; spec: SpecDocument; oas: string }
  | { ok: false; code: 'INVALID_SPEC'; errors: string }
  | { ok: false; code: 'UNSUPPORTED_VERSION'; version: string }
  | { ok: false; code: 'SPEC_LOAD_ERROR'; error: string };

// rawJson 으로 부터 추출된 엔드포인트 목록의 타입
export type ExtractedEndpoint = {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  tags: string[];
  operationJson: Prisma.InputJsonValue; // Prisma Input용 Json 타입
};
