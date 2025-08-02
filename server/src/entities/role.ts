import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Group } from './group';

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
}
