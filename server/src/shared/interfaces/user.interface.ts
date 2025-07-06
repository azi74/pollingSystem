export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithToken extends User {
  access_token: string;
}

export interface UserPayload {
  userId: number;
  email: string;
  role: 'USER' | 'ADMIN';
}