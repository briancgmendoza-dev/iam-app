import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Group } from './group';
import { Permission } from './permission';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Group, group => group.roles)
  groups!: Group[];

  @ManyToMany(() => Permission, permission => permission.roles, { cascade: true })
  @JoinTable()
  permissions!: Permission[];
}
