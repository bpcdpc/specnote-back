import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { ProjectCommentView } from "./projects.type";
import { SearchCommentDto } from "./dto/search-comment.dto";

@Injectable()
export class ProjectCommentService {
  constructor(
    private readonly prisma: PrismaService 
  ) {}

  // Post /projects/:id/comment-search — 프로젝트 전체 댓글 조회 
  async searchComment(projectId: number, dto: SearchCommentDto): Promise<ProjectCommentView[]> {
    const comments = await this.prisma.comment.findMany({
      where : { 
        projectId, 
        content: {
          contains: dto.keyword,
          mode: 'insensitive',    //대소문자 구분 무시
        },
        isDeleted: false,
        ...(dto.userIds && dto.userIds.length > 0 && 
          {
            userId: {
              in: dto.userIds
            },
          }),
        ...(dto.endpointIds && dto.endpointIds.length > 0 &&
          {
            endpointId: {
              in: dto.endpointIds
            },
          }),
      },
      select: {
        id: true, 
        endpointId: true,
        projectId: true,
        content: true,
        memberMentions: {
            include: {
              mentionedUser: {
                select: {
                  id: true,
                  userName: true,
                }
              }
            },
        },
          endpointMentions: {
            include: {
              endpoint: {
                select: {
                  id: true,
                  path: true,
                  method: true,
                }
              }
            }
          },
        },
       
      orderBy: [{id: 'desc'}],
    });

    // 정규식으로 멘션 제거 후 키워드 다시 체크 
    const cleanedComments = this.cleanedContent(dto.keyword, comments);
    
    // 리턴타입(ProjectCommentView) 적용하여 리턴
    return cleanedComments.map((comment) => this.createProjectCommentView(comment));

  }

  // 멘션 제거 후 키워드 다시 검색
  private cleanedContent(keyword: string, comments: any) {
    // 정규식
    const tagRegex = /(@\d+\\|#\d+\\)[,\s]*/g;

    const regexComment = comments.map((comment) =>  {
      const original = comment.content;

      // 1. 글자별 원본 인덱스 맵핑 테이블 생성
      // 태그를 제외한 순수 글자들이 원본의 몇 번째 인덱스였는지 추적하기 위해.
      let cleanedText = '';
      const indexMap: number[] = [];

      let match;
      let lastIndex = 0;

      // 정규식으로 태그 위치를 파악하며 순수 텍스트와 인덱스 매핑 배열을 만든다.
      while ((match = tagRegex.exec(original)) !== null) {
        const tagStart = match.index;
        // 태그 직전까지의 순수 텍스트 수집 
        for (let i = lastIndex; i < tagStart; i++) {
          cleanedText += original[i];
          indexMap.push(i);
        }
        lastIndex = tagRegex.lastIndex;
      }
      // 마지막 태그 이후 남은 텍스트 처리
      for (let i = lastIndex; i < original.length; i++) {
        cleanedText += original[i];
        indexMap.push(i);
      }

      // 2. 태그가 제거된 순수 텍스트에서 검색어 위치 파악
      const matchIndexInCleaned = cleanedText.toLowerCase().indexOf(keyword.toLowerCase());
      // 검색어가 매칭되지 않는다면 결과에서 제외
      if (matchIndexInCleaned === -1) return null;
      
      // 3. 찾은 검색어 시작점 기준 원본 데이터의 실제 하이라이트 시작 인덱스 획득
      const originalStartIndex = indexMap[matchIndexInCleaned];

      // 4. 요구사항 명세에 맞춰 텍스트를 분리
      // 키워드
      const foundKeyword = original.substring(originalStartIndex, originalStartIndex + keyword.length);
      // 키워드 앞에 나오는 문장 
      const beforeText = original.substring(0, originalStartIndex);
      // 키워드 뒤에 나오는 문장 
      const afterText = original.substring(originalStartIndex + keyword.length);

      return {
        ...comment,
        keyword: foundKeyword,
        beforeText,
        afterText,
      }
    })
    .filter((comment) => comment !== null);

    return regexComment;
  }

  //댓글 포멧(ProjectCommentView) 적용 
  private createProjectCommentView(raw: any): ProjectCommentView {
    const contentLength = 30;
    const contentArray = Array.from(raw.afterText);
    const afterTextArray = contentArray.slice(0, contentLength);

    return {
      id: raw.id,
      endpointId: raw.endpointId,
      projectId: raw.projectId,
      
      keyword: raw.keyword,
      beforeText: raw.beforeText.length > 0 ? '...' : raw.beforeText,
      afterText: afterTextArray.join(''),

      // 멤버 멘션 매핑
      memberMentions: (raw.memberMentions || []).map((m: any) => ({
        userId: m.mentionedUser.id,
        userName: m.mentionedUser.userName,
      })),

      // 엔드포인트 멘션 매핑
      endpointMentions: (raw.endpointMentions || []).map((e: any) => ({
        endpointId: e.endpoint.id,
        path: e.endpoint.path,
        method: e.endpoint.method,
      })),
    };
  }

  // Get /projects/:id/comments/search 
  async searchComments(projectId: number, keyword: string): Promise<ProjectCommentView[]> {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('검색어를 입력해주세요.');
    }

    const comments = await this.prisma.comment.findMany({
      where: {
        projectId,
        isDeleted: false,
        content: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      select:{
        id : true,
        projectId : true,
        endpointId: true,
        content:true,
        memberMentions: {
          include: {
            mentionedUser: {
              select: {
                id: true,
                userName: true,
                isAi: true,
              },
            },
          },
        },
        endpointMentions: {
          include: {
            endpoint: {
              select: {
                id: true,
                path: true,
                method: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }); 
    //console.log(comments);

    // 정규식으로 멘션 제거 후 키워드 다시 체크 
    const cleanedComments = this.cleanedContent(keyword, comments);
    
    // 리턴타입(ProjectCommentView) 적용하여 리턴
    return cleanedComments.map((comment) => this.createProjectCommentView(comment));

    // return comments.map((comment) => ({
    //   id: comment.id,
    //   projectId: comment.projectId,
    //   endpointId: comment.endpointId,
    //   snippet: this.buildSnippet(comment.content, keyword),
    //   //createdAt: comment.createdAt.toISOString(),
    //   memberMentions: (comment.memberMentions || []).map((m: any) => ({
    //     userId: m.mentionedUser.id,
    //     userName: m.mentionedUser.userName,
    //   })),

    //   // 엔드포인트 멘션 매핑
    //   endpointMentions: (comment.endpointMentions || []).map((e: any) => ({
    //     endpointId: e.endpoint.id,
    //     path: e.endpoint.path,
    //     method: e.endpoint.method,
    //   })),
    //   }));
  }

  // <mark>키워드</mark> 로 리턴
  private buildSnippet(content: string, keyword: string, contextLength = 20): string {
    const chars = Array.from(content);
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    const rawMatchIndex = lowerContent.indexOf(lowerKeyword);
    if (rawMatchIndex === -1) return chars.slice(0, contextLength * 2).join('');
    const matchIndex = Array.from(content.slice(0,rawMatchIndex)).length;
    const keywordLength = Array.from(keyword).length;

    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(
      chars.length,
      matchIndex + keywordLength + contextLength,
    );

    const prefix = start > 0 ? '...' : '';
    const suffix = end < content.length ? '...' : '';

    const before = chars.slice(start, matchIndex).join('');
    const matched = chars.slice(matchIndex, matchIndex + keywordLength).join('');
    const after = chars.slice(matchIndex + keywordLength, end).join('');

    return `${prefix}${before}<mark>${matched}</mark>${after}${suffix}`;
  }

}
