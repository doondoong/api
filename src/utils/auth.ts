import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface JWTPayload {
  email: number;
  exp: number;
}

// JWT secret key
const secret = "ilovedoong";

/**
 * JWT 토큰을 생성합니다.
 * @param payload 토큰에 담을 정보
 * @returns 생성된 토큰 문자열
 */
export function generateToken(payload: JWTPayload): string {
  const token = jwt.sign(payload, secret);
  return token;
}

/**
 * JWT 토큰을 검증하고, 검증된 토큰의 payload를 반환합니다.
 * @param token 검증할 토큰 문자열
 * @returns 검증된 payload 객체
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, secret) as JWTPayload;
    return payload;
  } catch (err) {
    throw new Error("Invalid token");
  }
}

/**
 * JWT 인증 미들웨어 함수입니다.
 * @param req Express Request 객체
 * @param res Express Response 객체
 * @param next Express NextFunction 객체
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const payload = verifyToken(token);
    req.body.email = payload.email;
    next();
  } catch (err) {
    console.log(err);
    res.sendStatus(403);
    return;
  }
}
