import { CreateCommentDto } from './create-comment.dto';

// 명세상 CreateCommentDto 와 동일하나 형식상 분리 (수정도 content + 멘션 동기화)
export class UpdateCommentDto extends CreateCommentDto {}
