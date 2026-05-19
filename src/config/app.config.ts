import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
	nodeEnv: process.env.NODE_ENV,
	port: parseInt(process.env.PORT ?? '3000', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
	secret: process.env.JWT_SECRET,
	expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
	refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
}));