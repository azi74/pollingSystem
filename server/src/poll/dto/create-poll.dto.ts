export class CreatePollDto {
  title!: string;
  description?: string;
  options!: string[];
  isPublic!: boolean;
  expiresAt!: Date;
  allowedUserIds?: number[];
}