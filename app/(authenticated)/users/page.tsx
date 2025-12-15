import { getUsers } from './actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FiEdit, FiPlus } from 'react-icons/fi'

export const revalidate = 60

export default async function UsersPage() {
  const result = await getUsers()

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <div className="text-center py-12 text-muted-foreground">
          Ошибка загрузки пользователей
        </div>
      </div>
    )
  }

  const users = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <Link href="/users/new">
          <Button>
            <FiPlus className="mr-2 h-4 w-4" />
            Добавить пользователя
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Логин</th>
              <th className="px-4 py-3 text-left text-sm font-medium">ФИО</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Роль</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.userId} className="hover:bg-accent/50">
                <td className="px-4 py-3 text-sm">{user.userId}</td>
                <td className="px-4 py-3 text-sm font-medium">{user.userLogin}</td>
                <td className="px-4 py-3 text-sm">{user.fio}</td>
                <td className="px-4 py-3 text-sm">{user.eMail}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.userLevel === 9 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.userLevel === 9 ? 'Администратор' : 'Пользователь'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Активен' : 'Заблокирован'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <Link href={`/users/${user.userId}`}>
                    <Button variant="ghost" size="sm">
                      <FiEdit className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Нет пользователей
        </div>
      )}
    </div>
  )
}
