import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { User } from './user'
import { Role } from "./role";

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => User, user => user.groups, { cascade: true })
  @JoinTable()
  users!: User[];

  @ManyToMany(() => Role, role => role.groups, { cascade: true })
  @JoinTable()
  roles!: Role[];
}
