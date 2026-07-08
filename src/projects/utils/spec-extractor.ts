import { type SpecDocument, ExtractedEndpoint, SpecInfo } from './spec.type';
import { Prisma } from '@prisma/client';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

// 프로젝트 메타(title/description/version) 추출
// oasVersion은 여기서 다루지 않음 — loadSpec의 oas가 담당
// validate() 통과분이므로 info.title/version은 항상 존재(스펙 필수 필드)
export function extractSpecInfo(spec: SpecDocument): SpecInfo {
  return {
    title: spec.info.title,
    description: spec.info.description,
    version: spec.info.version,
  };
}

// 엔드포인트 목록 추출
export function extractEndpoints(spec: SpecDocument): ExtractedEndpoint[] {
  if (!spec.paths) return []; // OAS 3.1에서 paths는 optional

  const results: ExtractedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue; // pathItem이 undefined/null인 경우

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]; // operation type은 시스템이 추론하는 json 조각이어야 함.
      if (!operation) continue; // 해당 method 없으면 skip

      results.push({
        path,
        method,
        operationId: operation.operationId,
        summary: operation.summary,
        tags: operation.tags ?? [], // tags 없으면 빈 배열
        operationJson: operation as unknown as Prisma.InputJsonValue,
        // 데이터 만드는 마지막 과정에서 디비에 입력 가능한 Json 타입으로 확정.
        // 디비에 입력하는 과정에서 unknown이 없이도 타입캐스팅 가능하다면 as unknown은 생략 가능.
      });
    }
  }

  return results;
}
