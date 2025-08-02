import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../entities/user'
import { Group } from '../entities/group'
import { Role } from '../entities/role'
import { Module } from '../entities/module'

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logging: true,
  entities: [User, Group, Role, Module],
})
