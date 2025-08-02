import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';

dotenv.config();

const userRepository = AppDataSource.getRepository(User);

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      const user = await userRepository.findOneBy({ id: jwtPayload.id });
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;
