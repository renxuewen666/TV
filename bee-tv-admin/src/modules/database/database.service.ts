import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService {
  private backupDir = path.resolve(process.cwd(), 'backups');
  private blockedTables = new Set(['_prisma_migrations']);

  constructor(private prisma: PrismaClient) {
    if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });
  }

  private get dbPath() {
    const url = process.env.DATABASE_URL || 'file:./data/bee-tv.db';
    const file = url.replace(/^file:/, '');
    return path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  }

  private quoteIdent(name: string) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new BadRequestException('非法表名或字段名');
    return `"${name.replace(/"/g, '""')}"`;
  }

  private async assertTable(table: string) {
    if (this.blockedTables.has(table)) throw new BadRequestException('系统表不允许操作');
    const tables = await this.tables();
    if (!tables.some(t => t.name === table)) throw new NotFoundException('数据表不存在');
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) return [];
    const files = fs.readdirSync(this.backupDir).filter(f => f.startsWith('backup-') && f.endsWith('.db'));
    return files.map(f => {
      const stat = fs.statSync(path.join(this.backupDir, f));
      return { name: f, size: (stat.size / 1024).toFixed(1) + ' KB', createdAt: stat.birthtime };
    }).sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
  }

  async backup(prefix = 'backup') {
    if (!fs.existsSync(this.dbPath)) throw new BadRequestException('数据库文件不存在');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${prefix}-${ts}.db`;
    const dest = path.join(this.backupDir, filename);
    fs.copyFileSync(this.dbPath, dest);
    return { success: true, filename, dbPath: this.dbPath };
  }

  async download(filename: string, res: any) {
    const filepath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filepath)) throw new NotFoundException('备份文件不存在');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filepath).pipe(res);
  }

  async restore(filename: string) {
    const backupPath = path.join(this.backupDir, filename);
    if (!fs.existsSync(backupPath)) throw new NotFoundException('备份文件不存在');
    const preRestore = (await this.backup('backup-pre-restore')).filename;
    fs.copyFileSync(backupPath, this.dbPath);
    return { success: true, message: '数据库已还原，请重启服务生效', preRestore };
  }

  async delete(filename: string) {
    const filepath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filepath)) throw new NotFoundException('备份文件不存在');
    fs.unlinkSync(filepath);
    return { success: true };
  }

  async tables() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
    const result: any[] = [];
    for (const row of rows) {
      const table = row.name;
      if (this.blockedTables.has(table)) continue;
      const countRows: any[] = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${this.quoteIdent(table)}`);
      result.push({ name: table, count: Number(countRows[0]?.count || 0) });
    }
    return result;
  }

  async columns(table: string): Promise<any[]> {
    await this.assertTable(table);
    return this.prisma.$queryRawUnsafe<any[]>(`PRAGMA table_info(${this.quoteIdent(table)})`);
  }

  async rows(table: string, page = 1, size = 20, keyword = '') {
    await this.assertTable(table);
    const columns: any[] = await this.columns(table);
    const skip = (page - 1) * size;
    const tableName = this.quoteIdent(table);
    const searchable = columns.filter(c => ['TEXT', 'VARCHAR', 'CHAR'].some(t => String(c.type || '').toUpperCase().includes(t))).map(c => c.name);
    let where = '';
    const args: any[] = [];
    if (keyword && searchable.length) {
      where = ' WHERE ' + searchable.map(c => `${this.quoteIdent(c)} LIKE ?`).join(' OR ');
      searchable.forEach(() => args.push(`%${keyword}%`));
    }
    const totalRows: any[] = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tableName}${where}`, ...args);
    const list = await this.prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}${where} ORDER BY rowid DESC LIMIT ? OFFSET ?`, ...args, size, skip);
    return { list, total: Number(totalRows[0]?.count || 0), page, size, columns };
  }

  async query(sql: string) {
    const normalized = sql.trim().replace(/;$/, '');
    if (!/^select\s+/i.test(normalized)) throw new BadRequestException('仅允许执行 SELECT 查询');
    const list = await this.prisma.$queryRawUnsafe(normalized);
    return { list };
  }

  async updateRow(table: string, id: number, data: Record<string, any>) {
    await this.assertTable(table);
    await this.backup(`backup-before-update-${table}`);
    const columns: any[] = await this.columns(table);
    const validCols = new Set(columns.map(c => c.name).filter(name => name !== 'id'));
    const entries = Object.entries(data).filter(([key]) => validCols.has(key));
    if (!entries.length) throw new BadRequestException('没有可更新字段');
    const setSql = entries.map(([key]) => `${this.quoteIdent(key)} = ?`).join(', ');
    const values = entries.map(([, value]) => value);
    await this.prisma.$executeRawUnsafe(`UPDATE ${this.quoteIdent(table)} SET ${setSql} WHERE id = ?`, ...values, id);
    return { success: true };
  }

  async deleteRow(table: string, id: number) {
    await this.assertTable(table);
    await this.backup(`backup-before-delete-${table}`);
    const result = await this.prisma.$executeRawUnsafe(`DELETE FROM ${this.quoteIdent(table)} WHERE id = ?`, id);
    return { success: true, count: result };
  }

  async clearTable(table: string) {
    await this.assertTable(table);
    await this.backup(`backup-before-clear-${table}`);
    const result = await this.prisma.$executeRawUnsafe(`DELETE FROM ${this.quoteIdent(table)}`);
    return { success: true, count: result };
  }
}
