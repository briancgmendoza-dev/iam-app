import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany } from 'typeorm';
import { Module } from './module';
import { Role } from './role';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  action!: string; // create, read, update, delete

  @ManyToOne(() => Module, module => module.permissions)
  module!: Module;

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[];
}
