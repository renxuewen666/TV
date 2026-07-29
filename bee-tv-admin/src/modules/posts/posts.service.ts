import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaClient) {}

  async findAll(params: { page?: number; topic?: string; userId?: number }) {
    const page = params.page || 1;
    const limit = 20;
    const where: any = { status: 1 };
    if (params.topic) where.topic = params.topic;
    if (params.userId) where.userId = params.userId;

    const [list, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, nickname: true, avatar: true } },
          _count: { select: { comments: true, likes: true, favorites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      list: list.map(p => ({
        id: p.id,
        text: p.text,
        images: p.images ? p.images.split(',') : [],
        audio: p.audio,
        video: p.video,
        topic: p.topic,
        viewCount: p.viewCount,
        createdAt: p.createdAt,
        author: p.author,
        commentCount: p._count.comments,
        likeCount: p._count.likes,
        favoriteCount: p._count.favorites,
      })),
      total,
      page,
      pagecount: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
        _count: { select: { comments: true, likes: true, favorites: true } },
      },
    });
    if (!post) throw new NotFoundException('动态不存在');

    await this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    return {
      id: post.id,
      text: post.text,
      images: post.images ? post.images.split(',') : [],
      audio: post.audio,
      video: post.video,
      topic: post.topic,
      viewCount: post.viewCount + 1,
      createdAt: post.createdAt,
      author: post.author,
      commentCount: post._count.comments,
      likeCount: post._count.likes,
      favoriteCount: post._count.favorites,
    };
  }

  async create(userId: number, dto: { text?: string; images?: string; audio?: string; video?: string; topic?: string }) {
    return this.prisma.post.create({
      data: {
        userId,
        text: dto.text || '',
        images: dto.images || '',
        audio: dto.audio || '',
        video: dto.video || '',
        topic: dto.topic || '',
      },
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
      },
    });
  }

  async remove(userId: number, id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('动态不存在');
    if (post.userId !== userId) throw new NotFoundException('无权操作');
    await this.prisma.post.update({ where: { id }, data: { status: 0 } });
    return { success: true };
  }

  async like(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');

    const existing = await this.prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await this.prisma.postLike.create({ data: { postId, userId } });
    return { liked: true };
  }

  async favorite(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');

    const existing = await this.prisma.postFavorite.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await this.prisma.postFavorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.postFavorite.create({ data: { postId, userId } });
    return { favorited: true };
  }

  async getComments(postId: number, page = 1) {
    const limit = 20;
    const [list, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where: { postId, status: 1 },
        include: {
          author: { select: { id: true, nickname: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.postComment.count({ where: { postId, status: 1 } }),
    ]);
    return { list, total, page, pagecount: Math.ceil(total / limit) };
  }

  async addComment(userId: number, postId: number, dto: { content: string }) {
    return this.prisma.postComment.create({
      data: { postId, userId, content: dto.content },
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
      },
    });
  }
}
