export interface CreateUserDTO {
  name: string;
  dob: Date | string;
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name?: string | null;
  dob?: Date | null;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
