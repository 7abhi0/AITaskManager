import OpenAI from 'openai';
import { logger } from '../middleware/logger';
import { TaskPriority } from '../shared/types';

export class AIService {
  private static instance: AIService;
  private openai: OpenAI | null = null;
  private isAIConfigured = false;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.trim() !== '') {
      try {
        this.openai = new OpenAI({ apiKey });
        this.isAIConfigured = true;
        logger.info('OpenAI Service initialized successfully.');
      } catch (err: any) {
        logger.warn(`Failed to initialize OpenAI: ${err.message}. Using mock AI fallback.`);
      }
    } else {
      logger.info('OpenAI API Key is missing. Operating in Mock AI fallback mode.');
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * 1. Auto-categorize a task based on its title and description.
   */
  public async categorizeTask(title: string, description: string): Promise<string> {
    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that categorizes project tasks. Respond with exactly one category name (e.g. Frontend, Backend, Design, Marketing, QA, DevOps, Legal, Sales, Writing) and no other text.',
            },
            {
              role: 'user',
              content: `Task Title: "${title}"\nDescription: "${description}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 10,
        });
        const category = response.choices[0]?.message?.content?.trim();
        if (category) return category.replace(/[".]/g, '');
      } catch (err: any) {
        logger.error(`AI Task Categorization failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback
    const content = `${title} ${description}`.toLowerCase();
    if (content.includes('db') || content.includes('sql') || content.includes('mongo') || content.includes('api') || content.includes('server') || content.includes('backend') || content.includes('route')) {
      return 'Backend';
    }
    if (content.includes('css') || content.includes('html') || content.includes('react') || content.includes('ui') || content.includes('frontend') || content.includes('style') || content.includes('page')) {
      return 'Frontend';
    }
    if (content.includes('design') || content.includes('logo') || content.includes('color') || content.includes('mockup') || content.includes('figma')) {
      return 'Design';
    }
    if (content.includes('test') || content.includes('bug') || content.includes('qa') || content.includes('verify') || content.includes('fix')) {
      return 'QA';
    }
    if (content.includes('deploy') || content.includes('docker') || content.includes('aws') || content.includes('ci/cd') || content.includes('kubernetes') || content.includes('pipeline')) {
      return 'DevOps';
    }
    return 'General';
  }

  /**
   * 2. Predict task priority.
   */
  public async predictPriority(title: string, description: string): Promise<TaskPriority> {
    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI that assesses task priority. Choose exactly one value: LOW, MEDIUM, HIGH, or CRITICAL. Return only the selected word.',
            },
            {
              role: 'user',
              content: `Title: "${title}"\nDescription: "${description}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 5,
        });
        const priority = response.choices[0]?.message?.content?.trim().toUpperCase() as TaskPriority;
        if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) {
          return priority;
        }
      } catch (err: any) {
        logger.error(`AI Priority Prediction failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback
    const content = `${title} ${description}`.toLowerCase();
    if (content.includes('urgent') || content.includes('production crash') || content.includes('broken link') || content.includes('security check')) {
      return 'CRITICAL';
    }
    if (content.includes('important') || content.includes('feature completion') || content.includes('migration') || content.includes('demo')) {
      return 'HIGH';
    }
    if (content.includes('refactor') || content.includes('cleanup') || content.includes('optimization') || content.includes('meeting')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * 3. Recommend a task deadline.
   */
  public async recommendDeadline(title: string, description: string): Promise<Date> {
    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI that estimates project timelines. Given a task, estimate how many days from today it should be completed. Return only a single integer representing number of days.',
            },
            {
              role: 'user',
              content: `Title: "${title}"\nDescription: "${description}"`,
            },
          ],
          temperature: 0.5,
          max_tokens: 5,
        });
        const days = parseInt(response.choices[0]?.message?.content?.trim() || '', 10);
        if (!isNaN(days) && days > 0) {
          const date = new Date();
          date.setDate(date.getDate() + days);
          return date;
        }
      } catch (err: any) {
        logger.error(`AI Deadline Recommendation failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback: Return between 2 to 7 days based on length/keywords
    const days = title.length % 5 + 2;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * 4. Break task into subtasks.
   */
  public async breakIntoSubtasks(title: string, description: string): Promise<string[]> {
    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Break the provided task down into 3-5 concrete action items/subtasks. Return them as a simple numbered list, one per line (e.g. "1. Step description").',
            },
            {
              role: 'user',
              content: `Title: "${title}"\nDescription: "${description}"`,
            },
          ],
          temperature: 0.5,
          max_tokens: 150,
        });
        const lines = response.choices[0]?.message?.content?.split('\n') || [];
        const items = lines
          .map((line) => line.replace(/^\d+\.\s*/, '').trim())
          .filter((line) => line.length > 0);
        if (items.length > 0) return items;
      } catch (err: any) {
        logger.error(`AI Subtasks breakdown failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback
    return [
      `Define project specifications for: ${title}`,
      `Develop core implementation flow`,
      `Conduct validation checks and code review`,
      `Final deployment and verification`,
    ];
  }

  /**
   * 5. Generate daily productivity summary.
   */
  public async generateDailySummary(tasks: any[]): Promise<string> {
    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a Scrum Master writing a concise daily status summary. Summarize the user\'s progress based on this list of tasks. Highlight completed work and note what remains pending. Keep it under 100 words.',
            },
            {
              role: 'user',
              content: JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority }))),
            },
          ],
          temperature: 0.5,
          max_tokens: 200,
        });
        return response.choices[0]?.message?.content?.trim() || '';
      } catch (err: any) {
        logger.error(`AI Daily Summary failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const total = tasks.length;
    return `Daily Summary: Today, the team focused on ${total} tasks, successfully completing ${completed} (${Math.round((completed/Math.max(total, 1))*100)}% progress). Remaining items have been updated with updated estimates to prevent blocks. Focus is shifted onto critical and high-priority items.`;
  }

  /**
   * 6. Suggest workload optimization.
   */
  public async generateWorkloadSuggestions(workloads: any[]): Promise<string> {
    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Analyze team workloads and recommend balancing strategies. Provide 2-3 short suggestions on reassigning tasks based on task counts and hours. Keep it very concise.',
            },
            {
              role: 'user',
              content: JSON.stringify(workloads),
            },
          ],
          temperature: 0.5,
          max_tokens: 150,
        });
        return response.choices[0]?.message?.content?.trim() || '';
      } catch (err: any) {
        logger.error(`AI Workload Suggestions failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback
    if (workloads.length === 0) return 'All assignments are balanced. Keep up the good distribution!';
    const sorted = [...workloads].sort((a, b) => b.taskCount - a.taskCount);
    const busiest = sorted[0];
    const freest = sorted[sorted.length - 1];
    
    if (busiest.taskCount > freest.taskCount + 2) {
      return `Suggestion: Consider reassigning 1-2 minor tasks from ${busiest.userName} (${busiest.taskCount} tasks, ${busiest.estimatedHours}h estimated) to ${freest.userName} (${freest.taskCount} tasks, ${freest.estimatedHours}h estimated) to balance work cycles.`;
    }
    return 'Workload is distributed evenly across team members. No urgent load-balancing required.';
  }

  /**
   * 7. Detect overdue risks.
   */
  public async detectOverdueRisks(tasks: any[]): Promise<string[]> {
    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Scan the provided tasks and extract a JSON list of task titles that are at risk of missing their deadlines. Output ONLY a valid JSON string array e.g. ["Task A", "Task B"].',
            },
            {
              role: 'user',
              content: JSON.stringify(tasks.map(t => ({ title: t.title, deadline: t.deadline, status: t.status }))),
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        });
        const list = JSON.parse(response.choices[0]?.message?.content || '[]');
        if (Array.isArray(list)) return list;
      } catch (err: any) {
        logger.error(`AI Overdue Risk detection failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback: Select pending tasks whose deadline is within 48 hours
    const atRisk: string[] = [];
    const now = new Date().getTime();
    tasks.forEach((t) => {
      if (t.status !== 'COMPLETED' && t.deadline) {
        const diff = new Date(t.deadline).getTime() - now;
        if (diff < 48 * 60 * 60 * 1000) {
          atRisk.push(t.title);
        }
      }
    });
    return atRisk.length > 0 ? atRisk : ['No imminent deadline risks detected. All schedules are on track.'];
  }

  /**
   * 8. Suggest next best task.
   */
  public async suggestNextBestTask(tasks: any[], userId: string): Promise<any> {
    const userTasks = tasks.filter((t) => t.assignedTo && (t.assignedTo._id === userId || t.assignedTo === userId) && t.status !== 'COMPLETED');
    if (userTasks.length === 0) return null;

    if (this.isAIConfigured && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Review the user\'s active task list and select the single next best task they should focus on. Base the decision on priority (Critical/High) and closest deadline. Return exactly the task title and nothing else.',
            },
            {
              role: 'user',
              content: JSON.stringify(userTasks.map(t => ({ title: t.title, priority: t.priority, deadline: t.deadline }))),
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
        });
        const chosenTitle = response.choices[0]?.message?.content?.trim();
        const found = userTasks.find(t => t.title.toLowerCase().includes((chosenTitle || '').toLowerCase()));
        if (found) return found;
      } catch (err: any) {
        logger.error(`AI Next Best Task failed: ${err.message}. Using mock fallback.`);
      }
    }

    // Heuristic Fallback: Sort by priority weight, then deadline closeness
    const priorityWeights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const sorted = [...userTasks].sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      if (weightA !== weightB) return weightB - weightA;

      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    });

    return sorted[0] || null;
  }
}

export const aiService = AIService.getInstance();
