import { injectable } from "inversify";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { AccessTokenPayload, RefreshTokenPayload, TokenPair } from "../types/auth";

@injectable()
export class JWTService {
  private readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "supersecret";
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";
  private readonly ACCESS_TOKEN_EXPIRY = "15m"; 
  private readonly REFRESH_TOKEN_EXPIRY = "7d"; 

  generateTokenPair(payload: Omit<AccessTokenPayload, 'userId'> & { userId: string }): TokenPair {
    const tokenId = uuidv4();
    
    const accessTokenPayload: AccessTokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      userType: payload.userType
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      userType: payload.userType,
      tokenId
    };

    const accessToken = jwt.sign(accessTokenPayload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(refreshTokenPayload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });

    return {
      accessToken,
      refreshToken
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  }

  generateNewAccessToken(refreshTokenPayload: RefreshTokenPayload): string {
    const accessTokenPayload: AccessTokenPayload = {
      userId: refreshTokenPayload.userId,
      email: refreshTokenPayload.email,
      role: refreshTokenPayload.role,
      userType: refreshTokenPayload.userType
    };

    return jwt.sign(accessTokenPayload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
  }
}