import type { ListUsersResponse } from '../contracts/user'

export const mockListUsers: ListUsersResponse = {
  items: [
    { id: 'u1', name: '홍길동', email: 'hong@example.com', role: 'admin', createdAt: '2025-10-01' },
    {
      id: 'u2',
      name: '김민수',
      email: 'minsu@example.com',
      role: 'manager',
      createdAt: '2025-09-20',
    },
  ],
  total: 2,
}
