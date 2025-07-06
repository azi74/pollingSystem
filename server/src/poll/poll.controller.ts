import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PollService } from './poll.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { VoteDto } from './dto/vote.dto';

// Define the user interface
interface AuthenticatedUser {
  userId: number;
  role: string;
}

// Extend the Express Request interface
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('polls')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Req() req: AuthenticatedRequest, @Body() createPollDto: CreatePollDto) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create polls');
    }
    return this.pollService.createPoll(req.user.userId, createPollDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Req() req: AuthenticatedRequest) {
    return this.pollService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.pollService.findOne(+id, req.user.userId, req.user.role);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updatePollDto: UpdatePollDto,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update polls');
    }
    return this.pollService.update(+id, req.user.userId, updatePollDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete polls');
    }
    return this.pollService.remove(+id, req.user.userId);
  }

  @Post(':id/vote')
  @UseGuards(AuthGuard('jwt'))
  vote(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() voteDto: VoteDto,
  ) {
    return this.pollService.vote(+id, req.user.userId, voteDto);
  }

  @Get(':id/results')
  @UseGuards(AuthGuard('jwt'))
  getResults(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.pollService.getResults(+id, req.user.userId, req.user.role);
  }
}