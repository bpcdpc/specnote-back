-- CreateTable
CREATE TABLE "CommentImage" (
    "id" SERIAL NOT NULL,
    "commentId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommentImage" ADD CONSTRAINT "CommentImage_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentImage" ADD CONSTRAINT "CommentImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
