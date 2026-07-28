import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService {
  private dbPath = path.resolve(__dirname, '..', '..', '..', '..', 'prisma', 'dev.db');
  private backupDir = path.resolve(__dirname, '..', '..', '..', '..', 'backups');

  constructor() {
    if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) return [];
    const files = fs.readdirSync(this.backupDir).filter(f => f.startsWith('backup-') && f.endsWith('.db'));
    return files.map(f => {
      const stat = fs.statSync(path.join(this.backupDir, f));
      return { name: f, size: (stat.size / 1024).toFixed(1) + ' KB', createdAt: stat.birthtime };
    }).sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
  }

  async backup() {
    if (!fs.existsSync(this.dbPath)) throw new BadRequestException('数据库文件不存在');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${ts}.db`;
    const dest = path.join(this.backupDir, filename);
    fs.copyFileSync(this.dbPath, dest);
    return { success: true, filename };
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

    const preRestore = `backup-pre-restore-${Date.now()}.db`;
    fs.copyFileSync(this.dbPath, path.join(this.backupDir, preRestore));
    fs.copyFileSync(backupPath, this.dbPath);

    return { success: true, message: '数据库已还原，请重启服务生效', preRestore };
  }

  async delete(filename: string) {
    const filepath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filepath)) throw new NotFoundException('备份文件不存在');
    fs.unlinkSync(filepath);
    return { success: true };
  }
}
