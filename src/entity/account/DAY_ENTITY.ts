import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  AfterInsert,
  AfterUpdate,
  PrimaryColumn,
  JoinColumn,
  AfterLoad,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from "typeorm";
import dbConnection from "../../utils/dbConnection";
import { Account } from "./ACCOUNT_BOOK_ENTITY";

@Entity()
export class Day {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer" })
  userId: number;

  @Column({ type: "varchar", length: 20, nullable: true })
  name: string;

  @Column({ type: "varchar", comment: "기록일(YYYY-MM-DD)" })
  eventDate: string;

  @Column({ type: "integer", comment: "총수입", nullable: true, default: 0 })
  tot_income: number;

  @Column({ type: "integer", comment: "총지출", nullable: true, default: 0 })
  tot_expense: number;

  @Column({
    type: "integer",
    comment: "일합계",
    nullable: true,
    default: 0,
  })
  dayTotal: number;

  @OneToMany(() => Account, (account) => account.day)
  accounts: Account[];

  //   @AfterInsert()
  //   @AfterUpdate()
  //   async updateTotalIncome() {
  //     console.log("day start");
  //   //   if (!this.accounts) {
  //   //     console.log("Accounts not loaded.");
  //   //     return;
  //   //   }
  //   //   const totalIncome = this.accounts.reduce(
  //   //     (sum, account) => sum + account.income,
  //   //     0
  //   //   );
  //   //   const totalExpense = this.accounts.reduce(
  //   //     (sum, account) => sum + account.expense,
  //   //     0
  //   //   );
  //   //   const dayTotal = totalIncome + totalExpense;
  //   //   this.tot_income = totalIncome;
  //   //   this.tot_expense = totalExpense;
  //   //   this.dayTotal = dayTotal;
  //   //   await dbConnection.manager.save(this);
  //   // }
}
// @EventSubscriber()
// export class AccountSubscriber implements EntitySubscriberInterface<Account> {
//   listenTo() {
//     return Account;
//   }

//   /**
//    * Called before post insertion.
//    */
//   async afterInsert(event: InsertEvent<Account>) {
//     await console.log(`AFTER POST INSERTED: `, event.entity);
//   }
//   async afterUpdate(event: UpdateEvent<Account>) {
//     await console.log(`AFTER ENTITY UPDATED: `, event.entity);
//   }
// }
