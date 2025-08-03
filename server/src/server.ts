import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './db/data-source';
import passport from './config/passport';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import groupRoutes from './routes/group.routes';
import roleRoutes from './routes/role.routes';
import moduleRoutes from './routes/module.routes';
import permissionRoutes from './routes/permission.routes';
import accessControlRoutes from './routes/access-control.routes';
import { seedDatabase } from './db/seed';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected successfully');

    await seedDatabase();

    app.use('/', authRoutes);
    app.use('/users', userRoutes);
    app.use('/groups', groupRoutes);
    app.use('/roles', roleRoutes);
    app.use('/modules', moduleRoutes);
    app.use('/permissions', permissionRoutes);
    app.use('/', accessControlRoutes);

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error connecting to the database:', error);
  });
