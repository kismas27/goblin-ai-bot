import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dialog } from '../../entities/dialog.entity';
import { Message } from '../../entities/message.entity';
import { Project } from '../../entities/project.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { DialogsService } from './dialogs.service';
import { DialogsController } from './dialogs.controller';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Dialog, Message, Project, UserProfile]), OpenaiModule],
  providers: [DialogsService],
  controllers: [DialogsController],
  exports: [DialogsService],
})
export class DialogsModule {}