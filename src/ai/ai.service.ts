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
    console.log('DEBUG endpoint:', this.endpoint);
    console.log('DEBUG deploymentName:', this.deploymentName);
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
  async findRelevantCommentIds(
  comments: { id: number; author: string; content: string }[],
  query: string,
): Promise<number[]> {
  const commentList = comments
    .map((c) => `id=${c.id} | ${c.author}: ${c.content}`)
    .join('\n');
  //console.log('DEBUG comment:', commentList);
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
          content:
            '너는 댓글 목록에서 검색어와 관련된 댓글을 찾는 어시스턴트야. ' +
            '반드시 JSON 배열 형식으로만 응답해. 다른 설명이나 마크다운 없이 숫자 id의 배열만 반환해. ' +
            '예시: [1, 5, 9]. 관련 댓글이 없으면 빈 배열 []을 반환해.',
        },
        {
          role: 'user',
          content: `댓글 목록:\n${commentList}\n\n검색어: "${query}"\n\n위 검색어와 관련 있는 댓글들의 id를 JSON 배열로 반환해줘.`,
        },
      ],
      max_completion_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new InternalServerErrorException(
      `Azure AI Foundry 호출 실패: ${response.status} ${errorBody}`,
    );
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) {
    throw new InternalServerErrorException('검색 결과를 받지 못했습니다.');
  }

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const ids = JSON.parse(cleaned);

    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'number')) {
      throw new Error('예상치 못한 응답 형식');
    }

    return ids;
  } catch {
    throw new InternalServerErrorException('AI 응답 파싱에 실패했습니다.');
  }
}

async answerQuestion(
  thread: SummaryInput[],
  question: string,
): Promise<string> {
  const context = this.buildPrompt(thread); // 기존 buildPrompt 재사용

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
          content:
            '너는 댓글 스레드 내용을 참고해서 질문에 답하는 어시스턴트야. ' +
            '주어진 댓글 내용에 근거해서만 답변하고, 댓글에 없는 내용은 추측하지 말고 ' +
            '답변할 땐 관련 발언을 한 작성자를 함께 언급해줘.'+
            '"주어진 댓글과 관련된 내용을 찾을 수 없을 땐, 댓글에서 관련 내용을 찾을 수 없습니다"라고 답해. ' +
            '3문장 이내로 간결하게 정리해.',
        },
        {
          role: 'user',
          content: `댓글 스레드:\n\n${context}\n\n질문: ${question}`,
        },
      ],
      max_completion_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new InternalServerErrorException(
      `Azure AI Foundry 호출 실패: ${response.status} ${errorBody}`,
    );
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content;

  if (!answer) {
    throw new InternalServerErrorException('답변을 받지 못했습니다.');
  }

  return answer.trim();
}
}


