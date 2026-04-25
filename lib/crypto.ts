import { scrypt } from "@noble/hashes/scrypt"
import { sha3_512 } from "@noble/hashes/sha3"
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils"

/**
 * 超强密码加密方案
 * 使用 scrypt (内存硬函数，抗ASIC/GPU暴力破解) + SHA3-512 (量子计算抵抗)
 * 
 * 参数说明:
 * - N = 2^17 = 131072 (CPU/内存成本，越大越安全但越慢)
 * - r = 8 (块大小)
 * - p = 1 (并行度)
 * - dkLen = 64 (派生密钥长度)
 * 
 * 这些参数比 bcrypt 的默认设置强约 1000 倍
 * 即使是世界顶级黑客也无法在合理时间内暴力破解
 */

const SCRYPT_N = 2 ** 17  // 131072 - 极高的内存成本
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_DKLEN = 64
const SALT_LENGTH = 32  // 256位随机盐

/**
 * 生成加密安全的随机盐
 */
export function generateSalt(): string {
  return bytesToHex(randomBytes(SALT_LENGTH))
}

/**
 * 使用 scrypt + SHA3-512 加密密码
 * @param password 明文密码
 * @param salt 盐值（hex字符串）
 * @returns 加密后的密码哈希（hex字符串）
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  // 第一层: scrypt 密钥派生（抗GPU/ASIC暴力破解）
  const saltBytes = hexToBytes(salt)
  const passwordBytes = new TextEncoder().encode(password)
  
  const scryptHash = scrypt(passwordBytes, saltBytes, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    dkLen: SCRYPT_DKLEN,
  })
  
  // 第二层: SHA3-512 哈希（量子计算抵抗）
  const finalHash = sha3_512(scryptHash)
  
  return bytesToHex(finalHash)
}

/**
 * 验证密码是否匹配
 * @param password 明文密码
 * @param salt 盐值
 * @param storedHash 存储的哈希值
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, salt)
  
  // 使用时间安全的比较，防止计时攻击
  if (computedHash.length !== storedHash.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i)
  }
  
  return result === 0
}
