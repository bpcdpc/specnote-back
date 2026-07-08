import { validate, compileErrors } from '@readme/openapi-parser';
import type { SpecDocument, SpecResult } from './spec.type';

export async function loadSpec(url: string): Promise<SpecResult> {
  try {
    // 스펙 문서 fetch
    const json = await (await fetch(url)).json();

    // 라이브러리로 스펙 문서 검증
    // validate 함수의 mutation때문에 복사본으로 검사해야 함.
    const result = await validate(structuredClone(json));

    // 검증 실패
    if (!result.valid) {
      return { ok: false, code: 'INVALID_SPEC', errors: compileErrors(result) };
    }

    // 버전 필드 추출: 3.x는 openapi, 2.0은 swagger, 그 외는 unknown
    const version =
      typeof json.openapi === 'string'
        ? json.openapi
        : typeof json.swagger === 'string'
          ? json.swagger
          : 'unknown';

    // 지원 대상을 3.0.x / 3.1.x 으로 정확히 한정. 2.0, 3.2 이상, 불명은 모두 거부
    if (!/^3\.[01]\./.test(version)) {
      return { ok: false, code: 'UNSUPPORTED_VERSION', version };
    }

    // 결과 반환 : $ref 보존된 원본
    return { ok: true, spec: json as SpecDocument, oas: version };
  } catch (error) {
    // fetch() 실패, json() 실패, validate() 예외 대응.
    // validate 예외는 아직 없지만 나중에 @readme/openapi-parser 라이브러리가 업데이트될 경우를 대비.
    return {
      ok: false,
      code: 'SPEC_LOAD_ERROR',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
