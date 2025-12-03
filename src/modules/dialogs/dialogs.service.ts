import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dialog } from '../../entities/dialog.entity';
import { Message } from '../../entities/message.entity';
import { Project } from '../../entities/project.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { OpenaiService } from '../openai/openai.service';

@Injectable()
export class DialogsService {
  constructor(
    @InjectRepository(Dialog)
    private dialogRepository: Repository<Dialog>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private openaiService: OpenaiService,
  ) {}

  async buildContext(userId: number, dialogId: number): Promise<any[]> {
    const dialog = await this.dialogRepository.findOne({ where: { id: dialogId, user_id: userId } });
    if (!dialog) throw new Error('Dialog not found');

    const messages = await this.messageRepository.find({
      where: { dialog_id: dialogId },
      order: { created_at: 'ASC' },
    });

    const context = [];

    // System prompt
    context.push({ role: 'system', content: 'You are a helpful AI assistant powered by GPT-4o.' });

    // User profile
    const profile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    if (profile) {
      context.push({ role: 'system', content: `User profile: ${JSON.stringify(profile)}` });
    }

    // Dialog summary
    if (dialog.summary) {
      context.push({ role: 'system', content: `Dialog summary: ${dialog.summary}` });
    }

    // Project summary
    if (dialog.project_id) {
      const project = await this.projectRepository.findOne({ where: { id: dialog.project_id } });
      if (project?.summary) {
        context.push({ role: 'system', content: `Project summary: ${project.summary}` });
      }
    }

    // Last messages
    const lastMessages = messages.slice(-10); // last 10
    for (const msg of lastMessages) {
      context.push({ role: msg.role, content: msg.content });
    }

    return context;
  }

  async addMessage(dialogId: number, userId: number, role: 'user' | 'assistant', content: string, tokens: number = 0) {
    const message = this.messageRepository.create({
      dialog_id: dialogId,
      user_id: userId,
      role,
      content,
      tokens,
    });
    await this.messageRepository.save(message);
    // Check if need to compress
    // For simplicity, skip compression for now
  }

  async getOrCreateDefaultDialog(userId: number) {
    let dialog = await this.dialogRepository.findOne({
      where: { user_id: userId, title: 'Default' }
    });

    if (!dialog) {
      dialog = this.dialogRepository.create({
        user_id: userId,
        title: 'Default',
      });
      dialog = await this.dialogRepository.save(dialog);
    }

    return dialog;
  }

  async createDialog(userId: number, title?: string, projectId?: number) {
    const dialog = this.dialogRepository.create({
      user_id: userId,
      title,
      project_id: projectId,
    });
    return this.dialogRepository.save(dialog);
  }
}