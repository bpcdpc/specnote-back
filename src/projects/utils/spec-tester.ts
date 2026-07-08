import { validate, compileErrors } from '@readme/openapi-parser';

// #1 openapi 누락
const missingOpenapiField = {
  info: { title: 't', version: '1.0' },
  paths: {},
};
// #2 info 누락
const missingInfo = {
  openapi: '3.0.0',
  paths: {},
};
// #3 info.title/version 누락
const missingInfoRequiredFields = {
  openapi: '3.0.0',
  info: { description: '설명만' },
  paths: {},
};
// #4 $ref 대상 누락
const danglingRef = {
  openapi: '3.0.0',
  info: { title: 't', version: '1.0' },
  paths: {
    '/users': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DoesNotExist' },
            },
          },
        },
        responses: { '201': { description: '' } },
      },
    },
  },
  components: { schemas: {} },
};
// #5 type 오타
const invalidTypeValue = {
  openapi: '3.0.0',
  info: { title: 't', version: '1.0' },
  paths: {},
  components: {
    schemas: {
      Foo: { type: 'object', properties: { name: { type: 'strng' } } },
    },
  },
};
// #6 paths 타입 위반
const pathsNotObject = {
  openapi: '3.0.0',
  info: { title: 't', version: '1.0' },
  paths: 'should be object',
};
// #7 operation 타입 위반
const malformedOperation = {
  openapi: '3.0.0',
  info: { title: 't', version: '1.0' },
  paths: { '/users': { get: 'not an operation object' } },
};
// #8 openapi 문서가 아님
const notOpenApiAtAll = { hello: 'world', data: [1, 2, 3] };
// #9 정상
const validMinimal = {
  openapi: '3.0.0',
  info: { title: 't', version: '1.0' },
  paths: {},
};

// 에러 케이스 라벨링
const cases: Record<string, any> = {
  '#9 validMinimal(대조군)': validMinimal,
  '#1 missingOpenapiField': missingOpenapiField,
  '#2 missingInfo': missingInfo,
  '#3 missingInfoRequiredFields': missingInfoRequiredFields,
  '#4 danglingRef': danglingRef,
  '#5 invalidTypeValue': invalidTypeValue,
  '#6 pathsNotObject': pathsNotObject,
  '#7 malformedOperation': malformedOperation,
  '#8 notOpenApiAtAll': notOpenApiAtAll,
};

// 미리 정의된 에러 케이스 테스트
async function testSpecValidation() {
  for (const [label, spec] of Object.entries(cases)) {
    console.log(`\n===== ${label} =====`);
    try {
      const result = await validate(structuredClone(spec));
      if (result.valid) {
        console.log('PASS (valid==true)');
      } else {
        console.log('FAIL (valid==false)');
        console.log(compileErrors(result));
      }
    } catch (e) {
      // 라이브러리 버전업 대비
      console.log('THROW', e);
    }
  }
}
testSpecValidation();
