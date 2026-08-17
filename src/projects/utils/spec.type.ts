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

// rawJson 으로부터 추출된 엔드포인트 목록의 타입
export type ExtractedEndpoint = {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  tags: string[];
  operationJson: Prisma.InputJsonValue; // Prisma Input용 Json 타입
};

// extractSnapshotContent가 rawJson에서 꺼낸 operation 하나.
// ExtractedEndpoint 타입과 달리 쓰기용이 아니고, 읽기용이다.
// operationJson Prisma.InputJsonValue 타입이 아닌 이유이다.
export type SnapshotOperation = {
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  operationJson: Record<string, unknown>;
};

// 스냅샷 rawJson에서 Spec 조립에 필요한 전부
// operations는 key(path, method) 를 키로 하는 Map.
// 조립시 Endpoint 테이블을 순회하며 행마다 존재 여부를 조회하는 데 쓴다.
// 응답으로 나가지 않는 내부 타입이라 Map 사용이 가능
export type SnapshotContent = {
  info: {
    title: string;
    version: string;
    description: string | null;
  };
  oasVersion: string;
  components: unknown;
  operations: Map<string, SnapshotOperation>;
};
