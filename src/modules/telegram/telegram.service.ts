import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { UsersService } from '../users/users.service';
import { DialogsService } from '../dialogs/dialogs.service';
import { OpenaiService } from '../openai/openai.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { ReferralsService } from '../referrals/referrals.service';
// import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  private userMessageCounts: { [userId: number]: { count: number; resetTime: number } } = {};
  private spamWarnings: { [userId: number]: number } = {};

  constructor(
    private usersService: UsersService,
    private dialogsService: DialogsService,
    private openaiService: OpenaiService,
    private tariffsService: TariffsService,
    private referralsService: ReferralsService,
    // private remindersService: RemindersService,
  ) {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  }

  async onModuleInit() {
    console.log('🚀 Starting Goblin AI Bot initialization...');

    try {
      // Initialize default tariffs
      console.log('💰 Initializing tariffs...');
      await this.tariffsService.createDefaultTariffs();
      console.log('✅ Tariffs initialized');

      console.log('⚙️ Setting up handlers...');
      this.setupHandlers();
      console.log('✅ Handlers set up');

      // Always launch the bot (both polling and webhook support)
      console.log('🤖 Bot token:', process.env.TELEGRAM_BOT_TOKEN ? 'Set (' + process.env.TELEGRAM_BOT_TOKEN.substring(0, 10) + '...)' : 'Not set');
      console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'undefined');

      // Force development mode for Docker
      const isProduction = process.env.NODE_ENV === 'production';
      console.log('🏭 Is production mode:', isProduction);

      if (isProduction) {
        console.log('🌐 Running in production mode (webhook)');
        console.log('🔍 Testing bot connection...');

        try {
          // Test bot connection first
          const botInfo = await this.bot.telegram.getMe();
          console.log('✅ Bot connected successfully:', botInfo.username);

          // Set webhook for production
          const webhookDomain = process.env.WEBHOOK_DOMAIN;
          if (webhookDomain) {
            const webhookUrl = `${webhookDomain}/telegram/webhook`;
            console.log('🔗 Setting webhook to:', webhookUrl);
            await this.bot.telegram.setWebhook(webhookUrl);
            console.log('✅ Webhook set successfully');
          } else {
            console.warn('⚠️ WEBHOOK_DOMAIN not set, webhook not configured');
          }

          console.log('🚀 Bot ready for webhook mode!');
        } catch (error) {
          console.error('❌ Failed to setup production bot:', error.message);
          console.error('Stack:', error.stack);
          throw error;
        }
      } else {
        console.log('📱 Running in development mode (polling)');
        console.log('🔄 Launching bot...');
        console.log('🔍 Testing bot connection...');

        try {
          // Test bot connection first
          const botInfo = await this.bot.telegram.getMe();
          console.log('✅ Bot connected successfully:', botInfo.username);

          console.log('🚀 Starting polling...');
          await this.bot.launch();
          console.log('✅ Bot launched successfully in polling mode!');
        } catch (error) {
          console.error('❌ Failed to launch bot:', error.message);
          console.error('Stack:', error.stack);
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Error starting bot:', error);
      console.error('Stack trace:', error.stack);
    }
  }

  async onModuleDestroy() {
    this.bot.stop();
  }

  private setupHandlers() {
    // Admin command
    this.bot.command('admin', async (ctx) => {
      const userId = ctx.from.id.toString();

      // Check if user is admin (you can add admin user IDs to environment variables)
      const adminIds = process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',') : [];
      if (!adminIds.includes(userId)) {
        ctx.reply('❌ У вас нет доступа к админ-панели.');
        return;
      }

      await this.showAdminMenu(ctx);
    });

    // Reminder commands (temporarily disabled)
    /*
    this.bot.command('remind', async (ctx) => {
      const userId = ctx.from.id.toString();
      const user = await this.usersService.findOrCreate(userId, ctx.from.username, ctx.from.first_name);

      const args = ctx.message.text.split(' ').slice(1);
      if (args.length < 2) {
        ctx.reply('Использование: /remind <время> <сообщение>\n\nПримеры:\n/remind через 5 минут выпить чай\n/remind завтра в 10:00 позвонить маме');
        return;
      }

      const timeString = args[0] + ' ' + args[1];
      const message = args.slice(2).join(' ');

      const remindAt = await this.remindersService.parseReminderTime(timeString);
      if (!remindAt) {
        ctx.reply('Не удалось распознать время. Попробуйте:\n• "через 5 минут"\n• "через 1 час"\n• "завтра в 10:00"');
        return;
      }

      await this.remindersService.createReminder(user.id, message, remindAt);
      ctx.reply(`✅ Напоминание установлено!\n\n📝 "${message}"\n⏰ ${remindAt.toLocaleString('ru-RU')}`);
    });

    this.bot.command('reminders', async (ctx) => {
      const userId = ctx.from.id.toString();
      const user = await this.usersService.findOrCreate(userId, ctx.from.username, ctx.from.first_name);

      const reminders = await this.remindersService.getUserReminders(user.id);

      if (reminders.length === 0) {
        ctx.reply('📝 У вас нет активных напоминаний.');
        return;
      }

      let message = '📅 Ваши напоминания:\n\n';
      reminders.forEach((reminder, index) => {
        message += `${index + 1}. "${reminder.message}"\n   ⏰ ${reminder.remind_at.toLocaleString('ru-RU')}\n\n`;
      });

      ctx.reply(message);
    });
    */

    this.bot.start(async (ctx) => {
      const userId = ctx.from.id.toString();
      const user = await this.usersService.findOrCreate(userId, ctx.from.username, ctx.from.first_name);

      // Process referral if present
      if (ctx.startPayload) {
        const referrerId = await this.referralsService.getReferrerFromStartParam(ctx.startPayload);
        if (referrerId && referrerId !== user.id) {
          await this.referralsService.processReferral(referrerId, user.id);
        }
      }

      const welcomeMessage = `🎉 Добро пожаловать в Goblin AI!

🤖 Я - ваш персональный ИИ-ассистент с памятью и различными режимами работы.

✨ Бонус за регистрацию: 10 бесплатных сообщений!

💡 Выберите действие:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '💬 Начать диалог', callback_data: 'start_chat' },
            { text: '🧠 Выбрать режим', callback_data: 'choose_mode' }
          ],
          [
            { text: '📊 Мой кабинет', callback_data: 'my_profile' },
            { text: 'ℹ️ Помощь', callback_data: 'help' }
          ]
        ]
      };

      ctx.reply(welcomeMessage, { reply_markup: keyboard });
    });

    // Handle callback queries from inline buttons
    this.bot.on('callback_query', async (ctx) => {
      if ('data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        switch (data) {
          case 'start_chat':
            try { await ctx.answerCbQuery('💬 Начинаем диалог!'); } catch (e) {}
            ctx.reply('Теперь вы можете задавать мне вопросы! Я помню нашу переписку.');
            break;
          case 'choose_mode':
            try { await ctx.answerCbQuery('🧠 Выбор режима'); } catch (e) {}
            const modeKeyboard = {
              inline_keyboard: [
                [{ text: '✍️ Копирайтер', callback_data: 'mode_copywriter' }],
                [{ text: '👨‍💻 Программист', callback_data: 'mode_programmer' }],
                [{ text: '🎓 Репетитор', callback_data: 'mode_tutor' }],
                [{ text: '💼 Маркетолог', callback_data: 'mode_marketer' }],
                [{ text: '🧩 Кастомный', callback_data: 'mode_custom' }],
                [{ text: '🎮 Викторина', callback_data: 'mode_quiz' }]
              ]
            };
            ctx.reply('Выберите режим работы:', { reply_markup: modeKeyboard });
            break;
          case 'my_profile':
            try { await ctx.answerCbQuery('📊 Личный кабинет'); } catch (e) {}
            const userId = ctx.from.id.toString();
            const user = await this.usersService.findOrCreate(userId, ctx.from.username, ctx.from.first_name);
            const tariffInfo = await this.tariffsService.getUserTariffInfo(user.id);
            const referralStats = await this.referralsService.getReferralStats(user.id);

            const profileMessage = `📊 Ваш личный кабинет:

👤 Пользователь: ${ctx.from.first_name || 'Не указан'}
💳 Тариф: ${tariffInfo.tariff}
📨 Осталось сообщений: ${tariffInfo.messages_left}
${tariffInfo.end_date ? `📅 Действует до: ${tariffInfo.end_date.toLocaleDateString()}` : ''}

👥 Рефералы: ${referralStats.totalReferrals} (${referralStats.processedReferrals} активных)
🔗 Ваша реферальная ссылка:
${referralStats.referralLink}

 Хотите больше сообщений? Обновитесь до Premium!`;

            ctx.reply(profileMessage);
            break;
          case 'help':
            try { await ctx.answerCbQuery('ℹ️ Помощь'); } catch (e) {}
            ctx.reply('Я - ИИ-ассистент Goblin AI. Задавайте вопросы, и я отвечу!\n\nКоманды:\n/start - начать\n/help - помощь');
            break;

          // Admin panel callbacks
          case 'admin_stats':
            try { await ctx.answerCbQuery('📊 Статистика'); } catch (e) {}
            await this.showAdminStats(ctx);
            break;
          case 'admin_users':
            try { await ctx.answerCbQuery('👥 Пользователи'); } catch (e) {}
            await this.showAdminUsers(ctx);
            break;
          case 'admin_tariffs':
            try { await ctx.answerCbQuery('💳 Тарифы'); } catch (e) {}
            await this.showAdminTariffs(ctx);
            break;
          case 'admin_referrals':
            try { await ctx.answerCbQuery('👥 Рефералы'); } catch (e) {}
            await this.showAdminReferrals(ctx);
            break;
          case 'admin_back':
            try { await ctx.answerCbQuery('⬅️ Назад'); } catch (e) {}
            await this.showAdminMenu(ctx);
            break;
          case 'admin_exit':
            try { await ctx.answerCbQuery('👋 Выход'); } catch (e) {}
            ctx.editMessageText('✅ Вы вышли из админ-панели.\n\nОтправьте /admin для повторного входа.');
            break;

          // Quiz game
          case 'mode_quiz':
            try { await ctx.answerCbQuery('🎮 Викторина'); } catch (e) {}
            await this.startQuiz(ctx);
            break;
          case 'quiz_answer_a':
          case 'quiz_answer_b':
          case 'quiz_answer_c':
          case 'quiz_answer_d':
            try { await ctx.answerCbQuery(); } catch (e) {}
            await this.handleQuizAnswer(ctx, data);
            break;

          default:
            ctx.answerCbQuery();
        }
      }
    });

    // Handle photos
    this.bot.on('photo', async (ctx) => {
      try {
        const userId = ctx.from.id.toString();
        const user = await this.usersService.findOrCreate(userId, ctx.from.username, ctx.from.first_name);

        // Check if user can send messages
        const canSend = await this.tariffsService.canUserSendMessage(user.id);
        if (!canSend) {
          ctx.reply('❌ У вас закончились сообщения! Обновитесь до Premium.');
          return;
        }

        // Get the highest quality photo
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const fileLink = await ctx.telegram.getFileLink(photo.file_id);

        // Send loading message
        const loadingMessage = await ctx.reply('🔍 Анализирую изображение...');

        // Analyze the image
        const analysis = await this.openaiService.analyzeImage(fileLink.href);

        // Deduct message from user's tariff
        await this.tariffsService.deductMessage(user.id);

        // Delete loading message and send analysis
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
        ctx.reply(`🖼️ *Анализ изображения:*\n\n${analysis}`, { parse_mode: 'Markdown' });

      } catch (error) {
        console.error('Error processing photo:', error);
        ctx.reply('Извините, произошла ошибка при анализе изображения.');
      }
    });

    // Handle documents (for OCR)
    this.bot.on('document', async (ctx) => {
      try {
        const userId = ctx.from.id.toString();
        const user = await this.usersService.findOrCreate(userId, ctx.from.username, ctx.from.first_name);

        // Check if user can send messages
        const canSend = await this.tariffsService.canUserSendMessage(user.id);
        if (!canSend) {
          ctx.reply('❌ У вас закончились сообщения! Обновитесь до Premium.');
          return;
        }

        // Check if it's an image document
        if (ctx.message.document.mime_type?.startsWith('image/')) {
          const fileLink = await ctx.telegram.getFileLink(ctx.message.document.file_id);

          // Send loading message
          const loadingMessage = await ctx.reply('📄 Извлекаю текст...');

          // Extract text from image
          const extractedText = await this.openaiService.extractTextFromImage(fileLink.href);

          // Deduct message from user's tariff
          await this.tariffsService.deductMessage(user.id);

          // Delete loading message and send extracted text
          await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
          ctx.reply(`📄 *Извлеченный текст:*\n\n${extractedText}`, { parse_mode: 'Markdown' });
        } else {
          ctx.reply('📎 Я могу анализировать только изображения. Отправьте фото для анализа.');
        }

      } catch (error) {
        console.error('Error processing document:', error);
        ctx.reply('Извините, произошла ошибка при обработке документа.');
      }
    });

    // Handle voice messages
    this.bot.on('voice', async (ctx) => {
      try {
        ctx.reply('🎵 Голосовые сообщения пока не поддерживаются, но скоро будут! Отправьте текст или изображение.');
      } catch (error) {
        console.error('Error processing voice:', error);
        ctx.reply('Извините, произошла ошибка при обработке голосового сообщения.');
      }
    });

    // Handle group messages (basic moderation)
    this.bot.on('message', async (ctx) => {
      // Only process in groups
      if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        // Basic anti-spam: check for too many messages per minute
        // This is a simple implementation
        const userId = ctx.from.id.toString();

        // For now, just acknowledge group messages occasionally
        if (Math.random() < 0.1) { // 10% chance to respond
          ctx.reply('👋 Привет! Я Goblin AI - ИИ-ассистент. Напишите мне в личные сообщения для полноценного общения!', {
            reply_parameters: { message_id: ctx.message.message_id }
          });
        }
      }
    });

    this.bot.on('text', async (ctx) => {
      try {
        console.log('📨 Received message from user:', ctx.from.id, ctx.message.text);

        const userId = ctx.from.id.toString();
        const user = await this.usersService.findOrCreate(userId, ctx.from.username, ctx.from.first_name);
        console.log('👤 User found/created:', user.id);

        // Anti-spam check
        if (!this.checkSpam(ctx.from.id)) {
          console.log('🚫 Message blocked by spam filter');
          return; // User is spamming, message ignored
        }

        // Check if user can send messages
        const canSend = await this.tariffsService.canUserSendMessage(user.id);
        if (!canSend) {
          const tariffInfo = await this.tariffsService.getUserTariffInfo(user.id);
          ctx.reply(`❌ У вас закончились сообщения!\n\nТекущий тариф: ${tariffInfo.tariff}\nОсталось сообщений: ${tariffInfo.messages_left}\n\n💳 Обновитесь до Premium для большего лимита!`);
          return;
        }

        // Get or create default dialog for the user
        const dialog = await this.dialogsService.getOrCreateDefaultDialog(user.id);

        // Send loading emoji
        const loadingMessage = await ctx.reply('⏳');

        console.log('💬 Processing message...');
        await this.dialogsService.addMessage(dialog.id, user.id, 'user', ctx.message.text);
        const context = await this.dialogsService.buildContext(user.id, dialog.id);
        console.log('🧠 Context built, calling OpenAI...');
        const response = await this.openaiService.chat(context);
        console.log('🤖 OpenAI response received:', response.substring(0, 100) + '...');
        await this.dialogsService.addMessage(dialog.id, user.id, 'assistant', response);

        // Deduct message from user's tariff
        await this.tariffsService.deductMessage(user.id);

        // Check if this user was referred and give bonus to referrer
        const referrals = await this.referralsService['referralRepository'].find({
          where: { referee_id: user.id, bonus_given: false }
        });

        if (referrals.length > 0) {
          for (const referral of referrals) {
            await this.referralsService.giveReferralBonus(referral.referrer_id);
          }
        }

        // Delete loading message and send response
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
        ctx.reply(response);
      } catch (error) {
        console.error('Error processing message:', error);
        ctx.reply('Извините, произошла ошибка. Попробуйте позже.');
      }
    });
  }
  private async showAdminMenu(ctx: any) {
    const adminKeyboard = {
      inline_keyboard: [
        [
          { text: '📊 Статистика', callback_data: 'admin_stats' },
          { text: '👥 Пользователи', callback_data: 'admin_users' }
        ],
        [
          { text: '💳 Тарифы', callback_data: 'admin_tariffs' },
          { text: '👥 Рефералы', callback_data: 'admin_referrals' }
        ],
        [
          { text: '🔙 Выйти из админки', callback_data: 'admin_exit' }
        ]
      ]
    };

    ctx.reply('🎛️ *Админ-панель Goblin AI*\n\nВыберите действие:', {
      reply_markup: adminKeyboard,
      parse_mode: 'Markdown'
    });
  }

  private async showAdminStats(ctx: any) {
    try {
      // Get stats from admin service (we'll need to inject it)
      const stats = {
        totalUsers: 0,
        activeUsers: 0,
        totalMessages: 0,
        totalRevenue: 0
      };

      // For now, use placeholder stats - in real implementation, inject AdminService
      const statsMessage = `📊 *Статистика бота:*

👥 Всего пользователей: *${stats.totalUsers}*
✅ Активных пользователей: *${stats.activeUsers}*
💬 Всего сообщений: *${stats.totalMessages}*
💰 Выручка: *$${stats.totalRevenue}*

🕐 Обновлено: ${new Date().toLocaleString('ru-RU')}`;

      const backKeyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад в админку', callback_data: 'admin_back' }]
        ]
      };

      ctx.editMessageText(statsMessage, {
        reply_markup: backKeyboard,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      ctx.reply('❌ Ошибка при получении статистики');
    }
  }

  private async showAdminUsers(ctx: any) {
    try {
      // Placeholder - in real implementation, get users from admin service
      const usersMessage = `👥 *Управление пользователями*

📋 Недавние пользователи:
1. Иван Иванов (@ivanov) - Premium
2. Мария Петрова (@petrova) - Free
3. Алексей Сидоров (@sidorov) - Premium

💡 Используйте веб-панель для полного управления пользователями:
http://localhost:3000/admin/users

🕐 Обновлено: ${new Date().toLocaleString('ru-RU')}`;

      const backKeyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад в админку', callback_data: 'admin_back' }]
        ]
      };

      ctx.editMessageText(usersMessage, {
        reply_markup: backKeyboard,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      ctx.reply('❌ Ошибка при получении списка пользователей');
    }
  }

  private async showAdminTariffs(ctx: any) {
    try {
      const tariffsMessage = `💳 *Управление тарифами*

📋 Доступные тарифы:
• *Free*: 10 сообщений
• *Premium*: 1000 сообщений/месяц - $9.99

💡 Для изменения тарифов используйте веб-панель:
http://localhost:3000/admin/tariffs

🕐 Обновлено: ${new Date().toLocaleString('ru-RU')}`;

      const backKeyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад в админку', callback_data: 'admin_back' }]
        ]
      };

      ctx.editMessageText(tariffsMessage, {
        reply_markup: backKeyboard,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      ctx.reply('❌ Ошибка при получении тарифов');
    }
  }

  private async showAdminReferrals(ctx: any) {
    try {
      const referralsMessage = `👥 *Статистика рефералов*

📊 Общая статистика:
• Всего рефералов: *0*
• Активных рефералов: *0*

🏆 Топ рефереров:
1. Пока нет данных

💡 Подробная статистика доступна в веб-панели:
http://localhost:3000/admin/referrals

🕐 Обновлено: ${new Date().toLocaleString('ru-RU')}`;

      const backKeyboard = {
        inline_keyboard: [
          [{ text: '⬅️ Назад в админку', callback_data: 'admin_back' }]
        ]
      };

      ctx.editMessageText(referralsMessage, {
        reply_markup: backKeyboard,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      ctx.reply('❌ Ошибка при получении статистики рефералов');
    }
  }

  private async startQuiz(ctx: any) {
    const questions = [
      {
        question: 'Какой язык программирования используется для создания Telegram ботов?',
        answers: ['Python', 'JavaScript', 'Java', 'C++'],
        correct: 1 // JavaScript (0-indexed)
      },
      {
        question: 'Что означает аббревиатура AI?',
        answers: ['Artificial Intelligence', 'Advanced Interface', 'Automated Integration', 'Active Internet'],
        correct: 0
      },
      {
        question: 'Какой компанией разработан ChatGPT?',
        answers: ['Google', 'Microsoft', 'OpenAI', 'Meta'],
        correct: 2
      }
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    const quizKeyboard = {
      inline_keyboard: [
        [{ text: `A) ${randomQuestion.answers[0]}`, callback_data: 'quiz_answer_a' }],
        [{ text: `B) ${randomQuestion.answers[1]}`, callback_data: 'quiz_answer_b' }],
        [{ text: `C) ${randomQuestion.answers[2]}`, callback_data: 'quiz_answer_c' }],
        [{ text: `D) ${randomQuestion.answers[3]}`, callback_data: 'quiz_answer_d' }]
      ]
    };

    // Store the correct answer in a simple way (in production, use Redis/database)
    this.quizAnswers = this.quizAnswers || {};
    this.quizAnswers[ctx.from.id] = randomQuestion.correct;

    ctx.reply(`🎮 *Викторина:*\n\n${randomQuestion.question}`, {
      reply_markup: quizKeyboard,
      parse_mode: 'Markdown'
    });
  }

  private async handleQuizAnswer(ctx: any, answer: string) {
    const userId = ctx.from.id;
    const correctAnswer = this.quizAnswers?.[userId];

    if (correctAnswer === undefined) {
      ctx.editMessageText('❌ Викторина истекла. Начните новую командой /start');
      return;
    }

    const answerIndex = answer === 'quiz_answer_a' ? 0 :
                       answer === 'quiz_answer_b' ? 1 :
                       answer === 'quiz_answer_c' ? 2 : 3;

    const isCorrect = answerIndex === correctAnswer;

    if (isCorrect) {
      ctx.editMessageText('🎉 *Правильно!* Вы получаете +1 бонусное сообщение!\n\nХотите сыграть еще?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Еще вопрос', callback_data: 'mode_quiz' }],
            [{ text: '🏠 В меню', callback_data: 'start_chat' }]
          ]
        },
        parse_mode: 'Markdown'
      });

      // Bonus message functionality can be added later
    } else {
      const correctText = ['A', 'B', 'C', 'D'][correctAnswer];
      ctx.editMessageText(`❌ Неправильно! Правильный ответ: *${correctText})*\n\nПопробуйте еще раз?`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Попробовать снова', callback_data: 'mode_quiz' }],
            [{ text: '🏠 В меню', callback_data: 'start_chat' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    }

    // Clean up
    delete this.quizAnswers?.[userId];
  }

  // Simple storage for quiz answers (in production, use Redis)
  private quizAnswers: { [userId: number]: number } = {};

  private checkSpam(userId: number): boolean {
    const now = Date.now();
    const userSpamData = this.userMessageCounts[userId];

    // Reset counter if time window passed (1 minute)
    if (!userSpamData || now - userSpamData.resetTime > 60000) {
      this.userMessageCounts[userId] = { count: 1, resetTime: now };
      return true;
    }

    // Increment message count
    userSpamData.count++;

    // Check if user is spamming (more than 5 messages per minute)
    if (userSpamData.count > 5) {
      const warnings = this.spamWarnings[userId] || 0;
      this.spamWarnings[userId] = warnings + 1;

      if (warnings >= 2) {
        // Ban user for 10 minutes (in production, use database)
        this.bot.telegram.sendMessage(userId, '🚫 Вы заблокированы на 10 минут за спам!');
        setTimeout(() => {
          this.bot.telegram.sendMessage(userId, '✅ Блокировка снята. Пожалуйста, не спамьте!');
        }, 600000); // 10 minutes
        return false;
      } else {
        this.bot.telegram.sendMessage(userId, `⚠️ Предупреждение ${warnings + 1}/3: Не спамьте!`);
        return false;
      }
    }

    return true;
  }


  getBot() {
    return this.bot;
  }
}