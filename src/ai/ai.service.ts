import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SummaryInput } from '../comments/comments.type';

@Injectable()
export class AiService {
  // 외부 AI(Azure AI Foundry) 호출로 댓글 스레드 요약 문자열 생성
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly deploymentName: string;
  constructor() {
    const endpoint = process.env.AZURE_AI_ENDPOINT;
    const apiKey = process.env.AZURE_AI_API_KEY;
    const deploymentName = process.env.AZURE_AI_DEPLOYMENT_NAME;

    if (!endpoint || !apiKey || !deploymentName) {
      throw new InternalServerErrorException(
        'Azure AI Foundry 환경변수가 설정되지 않았습니다.',
      );
    }

    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.deploymentName = deploymentName;
  }
  async generateSummary(thread: SummaryInput[]): Promise<string> {
    const prompt = this.buildPrompt(thread);
    const url = `${this.endpoint}/openai/v1/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: this.deploymentName,
        messages: [
          {
            role: 'system',
            content: `너는 API 명세 댓글 스레드를 요약하는 어시스턴트야.

규칙:
- 전체 300자 이내로 쓴다.
- 논의의 쟁점과 결론만 남긴다. 발언을 시간순으로 나열하지 않는다.
- 이름은 그 사람의 입장이 결론에 영향을 준 경우에만 언급한다. 전원을 나열하지 않는다.
- 시각은 쓰지 않는다.
- 가운뎃점을 쓰지 않는다. 쉼표나 슬래시로 대체한다.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_completion_tokens: 2000,
        reasoning_effort: 'minimal',
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new InternalServerErrorException(
        `Azure AI Foundry 호출 실패: ${response.status} ${errorBody}`,
      );
    }
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      console.error('AI 응답 비어있음', {
        finish_reason: data.choices?.[0]?.finish_reason,
        usage: data.usage,
      });
      throw new InternalServerErrorException('요약 결과를 받지 못했습니다.');
    }

    return summary.trim();
  }
  private buildPrompt(thread: SummaryInput[]): string {
    return thread
      .map(
        (comment) =>
          `[${comment.createdAt}] ${comment.author}: ${comment.content}`,
      )
      .join('\n');
  }
}
