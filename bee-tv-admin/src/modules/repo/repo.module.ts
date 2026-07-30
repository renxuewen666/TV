import { Module } from '@nestjs/common';
import { RepoController } from './repo.controller';
import { RepoService } from './repo.service';
import { RepoScriptService } from './repo-script.service';

@Module({ controllers: [RepoController], providers: [RepoService, RepoScriptService] })
export class RepoModule {}
