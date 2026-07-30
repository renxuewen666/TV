import { SetMetadata } from '@nestjs/common';

export const ALLOW_APP_USER_KEY = 'allow-app-user';
export const AllowAppUser = () => SetMetadata(ALLOW_APP_USER_KEY, true);
