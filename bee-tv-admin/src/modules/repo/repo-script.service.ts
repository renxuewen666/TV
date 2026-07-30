import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as vm from 'vm';
import { CreateRepoScriptDto, UpdateRepoScriptDto, QueryRepoScriptDto } from './dto/repo-script.dto';

@Injectable()
export class RepoScriptService {
  constructor(private prisma: PrismaClient) {}

  async getScripts(query: QueryRepoScriptDto) {
    const { repoId, type, status, page = 1, size = 20 } = query;
    const where: any = {};
    if (repoId !== undefined) where.repoId = +repoId;
    if (type) where.type = type;
    if (status !== undefined) where.status = +status;

    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.repoScript.findMany({ where, skip, take: size, orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }] }),
      this.prisma.repoScript.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async createScript(dto: CreateRepoScriptDto) {
    return this.prisma.repoScript.create({
      data: {
        name: dto.name,
        repoId: dto.repoId ?? 0,
        type: dto.type || 'js',
        content: dto.content ?? '',
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
      },
    });
  }

  async updateScript(id: number, dto: UpdateRepoScriptDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.repoId !== undefined) data.repoId = dto.repoId;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.sort !== undefined) data.sort = dto.sort;
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.repoScript.update({ where: { id }, data });
  }

  async deleteScript(id: number) {
    await this.findOne(id);
    await this.prisma.repoScript.delete({ where: { id } });
    return { success: true };
  }

  async getScriptsByRepo(repoId: number) {
    return this.prisma.repoScript.findMany({
      where: { repoId, status: 1 },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async testScript(id: number) {
    const script = await this.findOne(id);
    if (script.type === 'js') {
      return this.testJsScript(script);
    }
    if (script.type === 'py') {
      return {
        status: 'ok',
        script: script.name,
        type: script.type,
        message: 'PY 脚本暂不支持在线测试，请在本地环境中运行',
        output: null,
      };
    }
    if (script.type === 'csp') {
      return {
        status: 'ok',
        script: script.name,
        type: script.type,
        message: 'CSP 脚本暂不支持在线测试',
        output: null,
      };
    }
    return {
      status: 'error',
      script: script.name,
      type: script.type,
      message: `不支持 ${script.type} 类型的脚本测试`,
      output: null,
    };
  }

  private testJsScript(script: any) {
    const sandbox: any = {
      result: null,
      console: {
        log: (...args: any[]) => { logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
        error: (...args: any[]) => { logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
        warn: (...args: any[]) => { logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
      },
      JSON,
      Date,
      Math,
    };
    const logs: string[] = [];

    try {
      const code = `(function() { ${script.content} \n return typeof result !== 'undefined' ? result : undefined; })()`;
      const context = vm.createContext(sandbox);
      const result = vm.runInContext(code, context, { timeout: 5000 });
      return {
        status: 'ok',
        script: script.name,
        type: script.type,
        message: 'JS 脚本执行成功',
        output: result === undefined ? null : result,
        logs,
      };
    } catch (e: any) {
      return {
        status: 'error',
        script: script.name,
        type: script.type,
        message: 'JS 脚本执行失败',
        output: null,
        error: e.message,
        logs,
      };
    }
  }

  private async findOne(id: number) {
    const script = await this.prisma.repoScript.findUnique({ where: { id } });
    if (!script) throw new NotFoundException('脚本不存在');
    return script;
  }
}
