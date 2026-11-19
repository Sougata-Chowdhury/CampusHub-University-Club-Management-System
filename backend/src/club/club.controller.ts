import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ClubService } from './club.service';
import {
  ApproveClubDto,
  CreateClubDto,
  HandleMemberApplicationDto,
  UpdateClubDto,
} from '../dto/club.dto';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@Controller('clubs')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createClub(@Body() createClubDto: CreateClubDto, @Request() req) {
    return this.clubService.createClub(createClubDto, req.user.userId);
  }

  /**
   * Public listing. Only approved + active clubs are ever exposed here.
   * Administrative listings live under the guarded admin endpoints.
   */
  @Get()
  async getAllClubs() {
    return this.clubService.getApprovedClubs();
  }

  @Get('my-clubs')
  @UseGuards(AuthGuard)
  async getUserClubs(@Request() req) {
    return this.clubService.getUserClubs(req.user.userId);
  }

  @Get('my-applications')
  @UseGuards(AuthGuard)
  async getUserApplications(@Request() req) {
    return this.clubService.getUserApplications(req.user.userId);
  }

  @Get('pending')
  @UseGuards(AuthGuard, AdminGuard)
  async getPendingClubs() {
    return this.clubService.getPendingClubs();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getClubById(@Param('id') id: string, @Request() req) {
    return this.clubService.getClubById(id, req.user.userId);
  }

  @Get(':id/applications')
  @UseGuards(AuthGuard)
  async getClubApplications(@Param('id') id: string, @Request() req) {
    return this.clubService.getClubApplications(id, req.user.userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateClub(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto,
    @Request() req,
  ) {
    return this.clubService.updateClub(id, updateClubDto, req.user.userId);
  }

  @Post(':id/apply')
  @UseGuards(AuthGuard)
  async applyToJoinClub(@Param('id') id: string, @Request() req) {
    return this.clubService.applyToJoinClub(id, req.user.userId);
  }

  @Delete(':id/withdraw-application')
  @UseGuards(AuthGuard)
  async withdrawApplication(@Param('id') id: string, @Request() req) {
    return this.clubService.withdrawApplication(id, req.user.userId);
  }

  @Put(':id/applications/:userId')
  @UseGuards(AuthGuard)
  async handleMemberApplication(
    @Param('id') clubId: string,
    @Param('userId') userId: string,
    @Body() handleApplicationDto: HandleMemberApplicationDto,
    @Request() req,
  ) {
    return this.clubService.handleMemberApplication(
      clubId,
      userId,
      handleApplicationDto,
      req.user.userId,
    );
  }

  @Patch(':id/applications/:applicationId')
  @UseGuards(AuthGuard)
  async handleMemberApplicationById(
    @Param('id') clubId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: { action: 'approve' | 'reject' },
    @Request() req,
  ) {
    return this.clubService.handleMemberApplicationById(
      clubId,
      applicationId,
      body.action,
      req.user.userId,
    );
  }

  @Put(':id/approve')
  @UseGuards(AuthGuard, AdminGuard)
  async approveClub(
    @Param('id') id: string,
    @Body() approveClubDto: ApproveClubDto,
    @Request() req,
  ) {
    return this.clubService.approveClub(id, approveClubDto, req.user.userId);
  }

  @Patch(':id/admin-action')
  @UseGuards(AuthGuard, AdminGuard)
  async handleAdminAction(
    @Param('id') clubId: string,
    @Body() body: { action: 'approve' | 'reject' },
  ) {
    return this.clubService.handleAdminAction(clubId, body.action);
  }

  @Delete(':id/members/:userId')
  @UseGuards(AuthGuard)
  async removeMember(
    @Param('id') clubId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.clubService.removeMember(clubId, userId, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteClub(@Param('id') id: string, @Request() req) {
    return this.clubService.deleteClub(id, req.user.userId);
  }

  @Post('maintenance/fix-creator-membership')
  @UseGuards(AuthGuard, AdminGuard)
  async fixCreatorMembership() {
    return this.clubService.fixCreatorMembership();
  }
}
