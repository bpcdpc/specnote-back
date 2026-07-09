import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipGuard } from '../common/guards/membership.guard';
import { ProjectRole } from '../common/decorators/project-role.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type AuthUser } from '../common/types/auth.type';
import { ProjectsService } from './projects.service';
import { MembershipsService } from './memberships.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CommitSpecDto } from './dto/commit-spec.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // 컨트롤러 전체 인증 필요(계층 1 이상)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly membershipsService: MembershipsService,
  ) {}

  // ── 계층 1: projectId 없음 (JwtAuthGuard 만) ──

  @ApiOperation({ summary: '프로젝트 생성' })
  @Post()
  createProject(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(user.id, dto);
  }

  @ApiOperation({ summary: '내 프로젝트 목록' })
  @Get()
  findMyProjects(@CurrentUser() user: AuthUser) {
    return this.projectsService.findMyProjects(user.id);
  }

  // ── 계층 2: :id = projectId (+ MembershipGuard) ──

  @ApiOperation({ summary: '프로젝트 진입' })
  @UseGuards(MembershipGuard)
  @Get(':id')
  findProject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.projectsService.findProject(user.id, id);
  }

  @ApiOperation({ summary: '[Owner] 프로젝트 수정 (tryItBaseUrl)' })
  @UseGuards(MembershipGuard)
  @ProjectRole(ROLE.OWNER)
  @Patch(':id')
  updateProject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(user.id, id, dto);
  }

  @ApiOperation({ summary: '[Owner] 프로젝트 삭제' })
  @UseGuards(MembershipGuard)
  @ProjectRole(ROLE.OWNER)
  @Delete(':id')
  softDeleteProject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.projectsService.softDeleteProject(user.id, id);
  }

  @ApiOperation({ summary: '[Owner] 스펙 업데이트' })
  @UseGuards(MembershipGuard)
  @ProjectRole(ROLE.OWNER)
  @Post(':id/spec-commits')
  commitSpec(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CommitSpecDto,
  ) {
    return this.projectsService.commitSpec(user.id, id, dto);
  }

  // ── 멤버십 (memberships.service 로 위임) ──

  @ApiOperation({ summary: '[Owner] 멤버 초대' })
  @UseGuards(MembershipGuard)
  @ProjectRole(ROLE.OWNER)
  @Post(':id/members')
  inviteMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMembershipDto,
  ) {
    return this.membershipsService.inviteMember(user.id, id, dto);
  }

  @ApiOperation({ summary: '[Owner] 멤버 제거' })
  @UseGuards(MembershipGuard)
  @ProjectRole(ROLE.OWNER)
  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.membershipsService.removeMember(user.id, id, userId);
  }

  @ApiOperation({ summary: '멤버 목록' })
  @UseGuards(MembershipGuard)
  @Get(':id/members')
  findMembers(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.membershipsService.findMembers(user.id, id);
  }
}
