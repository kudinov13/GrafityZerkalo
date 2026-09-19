import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'ramcy-secret-key-change-in-production'

export interface AuthRequest extends Request {
  adminId?: number
  adminUsername?: string
}

export function generateToken(adminId: number, username: string): string {
  return jwt.sign({ id: adminId, username }, JWT_SECRET, { expiresIn: '7d' })
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Не авторизован' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string }
    req.adminId = decoded.id
    req.adminUsername = decoded.username
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}

export { JWT_SECRET }
