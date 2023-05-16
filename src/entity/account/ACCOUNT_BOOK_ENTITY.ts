import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 20 })
  name: string;

  @Column({ type: "integer", comment: "정렬순서", nullable: true })
  sortingNumber: number;

  @Column({ type: "varchar", comment: "기록일(YYYY-MM-DD)" })
  eventDate: string;

  @Column({ type: "integer", comment: "수입", nullable: true })
  income: number;

  @Column({ type: "integer", comment: "지출", nullable: true })
  expense: number;

  @Column({ type: "integer", comment: "합계", nullable: true })
  total: number;

  @Column({ type: "integer", comment: "차액", nullable: true })
  difference: number;

  @Column({ type: "varchar", length: 40, comment: "메모", nullable: true })
  memo: string;

  @Column({ nullable: false, type: "varchar", length: 10 })
  category: string;
}
