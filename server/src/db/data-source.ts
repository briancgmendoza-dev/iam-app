import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../entities/user'

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logging: true,
  entities: [User],
})
