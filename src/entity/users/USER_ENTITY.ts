import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";

enum gender {
  mail = "남",
  female = "여",
}
@Entity()
@Unique(["email"])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 20 })
  name: string;

  @Column({ type: "integer", nullable: true })
  age: number;

  @Column({ type: "enum", enum: gender, nullable: true })
  gender: gender;

  @Column({ type: "varchar", length: 20 })
  email: string;

  @Column({ type: "varchar", length: 100 })
  password: string;
}
