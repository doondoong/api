import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  AfterInsert,
  AfterUpdate,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  AfterLoad,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from "typeorm";
import dbConnection from "../../utils/dbConnection";
import { Day } from "./DAY_ENTITY";
@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer" })
  userId: number;

  @Column({ type: "varchar", length: 20, nullable: true })
  name: string;

  @Column({ type: "integer", comment: "정렬순서", nullable: true })
  sortingNumber: number;

  @Column({ type: "varchar", comment: "기록일(YYYY-MM-DD)" })
  eventDate: string;

  @Column({ type: "integer", comment: "수입", nullable: true, default: 0 })
  income: number;

  @Column({ type: "integer", comment: "지출", nullable: true, default: 0 })
  expense: number;

  @Column({
    type: "integer",
    comment: "합계",
    nullable: true,
    default: 0,
  })
  total: number;

  @Column({ type: "varchar", length: 40, comment: "메모", nullable: true })
  memo: string;

  @Column({ nullable: false, type: "varchar", length: 10 })
  category: string;

  @ManyToOne(() => Day, (day) => day.accounts)
  day: Day;
}
