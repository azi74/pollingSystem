import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { VoteDto } from './dto/vote.dto';

@Injectable()
export class PollService {
  constructor(private prisma: PrismaService) {}

  async createPoll(userId: number, createPollDto: CreatePollDto) {
    const { allowedUserIds, ...pollData } = createPollDto;
    
    // Validate duration (max 2 hours)
    const now = new Date();
    const maxExpiry = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (pollData.expiresAt > maxExpiry) {
      throw new ForbiddenException('Maximum poll duration is 2 hours');
    }

    return this.prisma.poll.create({
      data: {
        ...pollData,
        authorId: userId,
        allowedUsers: {
          connect: allowedUserIds?.map(id => ({ id })) || [],
        },
      },
    });
  }

  async findAll(userId: number, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.poll.findMany({
        where: { authorId: userId },
        include: { votes: true },
      });
    } else {
      return this.prisma.poll.findMany({
        where: {
          OR: [
            { isPublic: true },
            { allowedUsers: { some: { id: userId } } },
          ],
        },
      });
    }
  }

  async findOne(id: number, userId: number, role: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      include: {
        votes: true,
        allowedUsers: role === 'USER' ? { where: { id: userId } } : true,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check access for private polls
    if (!poll.isPublic && role === 'USER' && !poll.allowedUsers.length) {
      throw new ForbiddenException('You do not have access to this poll');
    }

    return poll;
  }

  async update(id: number, userId: number, updatePollDto: UpdatePollDto) {
    const poll = await this.prisma.poll.findUnique({ where: { id } });
    
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }
    
    if (poll.authorId !== userId) {
      throw new ForbiddenException('You can only update your own polls');
    }

    if (new Date() > poll.expiresAt) {
      throw new ForbiddenException('Cannot update expired polls');
    }

    const { allowedUserIds, ...pollData } = updatePollDto;
    
    return this.prisma.poll.update({
      where: { id },
      data: {
        ...pollData,
        allowedUsers: {
          set: allowedUserIds?.map(id => ({ id })) || [],
        },
      },
    });
  }

  async remove(id: number, userId: number) {
    const poll = await this.prisma.poll.findUnique({ where: { id } });
    
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }
    
    if (poll.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own polls');
    }

    return this.prisma.poll.delete({ where: { id } });
  }

  async vote(pollId: number, userId: number, voteDto: VoteDto) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { allowedUsers: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (new Date() > poll.expiresAt) {
      throw new ForbiddenException('Poll has expired');
    }

    if (!poll.isPublic && !poll.allowedUsers.some(u => u.id === userId)) {
      throw new ForbiddenException('You are not allowed to vote in this poll');
    }

    // Check if user already voted
    const existingVote = await this.prisma.vote.findFirst({
      where: { pollId, userId },
    });

    if (existingVote) {
      throw new ForbiddenException('You have already voted in this poll');
    }

    return this.prisma.vote.create({
      data: {
        pollId,
        userId,
        option: voteDto.option,
      },
    });
  }

  async getResults(pollId: number, userId: number, role: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        allowedUsers: role === 'USER' ? { where: { id: userId } } : false,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (!poll.isPublic && role === 'USER' && !poll.allowedUsers.length) {
      throw new ForbiddenException('You do not have access to this poll');
    }

    const votes = await this.prisma.vote.groupBy({
      by: ['option'],
      where: { pollId },
      _count: { option: true },
    });

    return {
      poll,
      results: votes.map(v => ({ option: v.option, count: v._count.option })),
    };
  }
}