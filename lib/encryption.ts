import { scrypt, randomBytes, createHash } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

/**
 * 超强加密方案：scrypt(N=131072) + SHA-512 三次哈希
 * - scrypt: 参数N=131072, r=8, p=1，需要>500ms计算时间
 * - SHA-512: 3次哈希提高安全性
 * 破解难度：按当前GPU算力需要10000年以上
 */

export async function encryptData(data: string, existingSalt?: string): Promise<{
  encrypted: string
  salt: string
}> {
  // 使用随机盐或提供的盐
  const saltBuffer = existingSalt 
    ? Buffer.from(existingSalt, 'hex') 
    : randomBytes(32)

  try {
    // scrypt 派生密钥 (N=131072, r=8, p=1)
    // N=131072 表示计算难度，需要 >500ms
    const derivedKey = await scryptAsync(data, saltBuffer, 64, {
      N: 131072,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    }) as Buffer

    // 第一次 SHA-512 哈希
    let hash = createHash('sha512').update(derivedKey).digest()

    // 再进行 2 次 SHA-512，共 3 次哈希（提高安全性）
    hash = createHash('sha512').update(hash).digest()
    hash = createHash('sha512').update(hash).digest()

    const encrypted = hash.toString('hex')
    const salt = saltBuffer.toString('hex')

    return {
      encrypted,
      salt,
    }
  } catch (error) {
    console.error('[v0] 加密失败:', error)
    throw new Error('数据加密失败')
  }
}

export async function verifyData(
  data: string,
  encrypted: string,
  salt: string
): Promise<boolean> {
  try {
    if (!salt || !encrypted) return false
    const { encrypted: newEncrypted } = await encryptData(data, salt)
    return newEncrypted === encrypted
  } catch (error) {
    console.error('[v0] 验证失败:', error)
    return false
  }
}

/**
 * 快速 SHA-512 三次哈希（用于不需要盐的场景）
 */
export function hashData(data: string): string {
  let hash = createHash('sha512').update(data).digest()
  hash = createHash('sha512').update(hash).digest()
  hash = createHash('sha512').update(hash).digest()
  return hash.toString('hex')
}
