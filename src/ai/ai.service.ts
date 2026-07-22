import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
      throw new NotFoundException('Azure AI Foundry 환경변수가 설정되지 않았습니다.');
    }

    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.deploymentName = deploymentName;
  }
  async generateSummary(thread: SummaryInput[]): Promise<string> {
    // TODO: Azure AI Foundry 클라이언트 호출 → 요약 string 반환 (SDK 세부는 구현 시점)
    const prompt = this.buildPrompt(thread);
    const url = `${this.endpoint}/openai/v1/chat/completions`;
    const response = await fetch(url,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'api-key':this.apiKey,
      },
      body: JSON.stringify({
        model: this.deploymentName,
        messages:[{
          role:'system',
          content:'너는 댓글 스레드를 요약하는 어시스턴트야. ' +
            '요약할 때 누가 어떤 의견을 냈는지 작성자 이름과[시간(년도/월/일 시간(시:분:초))]을 반드시 차례로 언급하고, ' +
            '3문장 이내로 간결하게 정리해.',
        },
      {
        role:'user',
        content:prompt,
      },
    ],
    max_completion_tokens:300,
    temperature:0.3,
      }),
    });
    if(!response.ok){
      const errorBody = await response.text();
      throw new NotFoundException(`Azure AI Foundry 호출 실패: ${response.status} ${errorBody}`);
    }
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;
    if(!summary){
      throw new NotFoundException('요약 결과를 받지 못했습니다.');
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


