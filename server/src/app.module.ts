import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PollModule } from './poll/poll.module';
import { UserModule } from './user/user.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [AuthModule, PollModule, UserModule],
  providers: [PrismaService],
})
export class AppModule {}