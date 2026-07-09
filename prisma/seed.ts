import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// 전역 AI 계정 (User.isAi = true).
//  - findAiUser() 가 이 계정을 찾음
//  - 초대/멤버십/멘션 대상에서는 제외됨 (findByEmail 등이 isAi:false 로 필터, FR-13.7)
const AI_EMAIL = 'ai@specnote.system'; // 실제 초대 안 되는 도메인
const AI_NAME = 'SpecNote AI';

async function main() {
  // 로그인 용도가 아니므로 비밀번호는 랜덤값(예측 불가) 해시
  const password = await bcrypt.hash(randomUUID(), 10);

  const ai = await prisma.user.upsert({
    where: { email: AI_EMAIL },
    update: { isAi: true }, // 이미 있으면 플래그만 보정
    create: {
      email: AI_EMAIL,
      userName: AI_NAME,
      password,
      isAi: true,
    },
    select: { id: true, email: true, isAi: true },
  });

  console.log('AI 계정 시드 완료:', ai);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
