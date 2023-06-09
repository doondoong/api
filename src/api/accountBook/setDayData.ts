import express from "express";
import { Account } from "../../entity/account/ACCOUNT_BOOK_ENTITY";
import { Day } from "../../entity/account/DAY_ENTITY";
import dbConnection from "../../utils/dbConnection";

const setDayData = express.Router();
setDayData.get("/", (req, res) => {
  return res.status(405).send("Method Not Allowed");
});
setDayData.post("/", async (req, res) => {
  const {
    id,
    userId,
    name,
    sortingNumber,
    eventDate,
    income,
    expense,
    difference,
    memo,
    category,
  } = req.body;
  if (!userId || !eventDate || !category) {
    return res.status(400).json({ message: "필수값 누락" });
  }
  try {
    let account = await dbConnection.manager.findOne(Account, {
      where: { userId, category, eventDate },
    });

    const inputIncome = income ?? 0;
    const inputExpense = expense ?? 0;
    const total = inputIncome - inputExpense;
    if (account) {
      await dbConnection
        .createQueryBuilder()
        .update(Account)
        .set({
          sortingNumber: sortingNumber,
          income: income,
          expense: expense,
          total: total,
          memo: memo,
          category: category,
        })
        .where("id = :id", { id: account.id })
        .execute();
    } else {
      await dbConnection
        .createQueryBuilder()
        .insert()
        .into(Account)
        .values({
          userId: userId,
          name: name,
          eventDate: eventDate,
          sortingNumber: sortingNumber,
          income: income,
          expense: expense,
          total: total,
          memo: memo,
          category: category,
        })
        .execute();
      let dayData = await dbConnection.manager.findOne(Day, {
        where: { userId, eventDate },
      });
      if (!dayData) {
        await dbConnection
          .createQueryBuilder()
          .insert()
          .into(Day)
          .values({
            userId: userId,
            name: name,
            eventDate: eventDate,
          })
          .execute();
      }
    }
    let dayTotal = await dbConnection.manager.find(Account, {
      where: { userId: userId, eventDate: eventDate },
      select: ["income", "expense", "total"],
    });
    console.log(dayTotal, "dayTotal");
    let sumIncome = 0;
    let sumExpense = 0;
    let sumTotal = 0;
    dayTotal.forEach((result) => {
      sumIncome += result.income;
      sumExpense += result.expense;
      sumTotal += result.total;
    });

    await dbConnection
      .createQueryBuilder()
      .update(Day)
      .set({
        tot_income: sumIncome,
        tot_expense: sumExpense,
        dayTotal: sumTotal,
      })
      .where("userId = :userId", { userId: userId })
      .where("eventDate = :eventDate", { eventDate: account.eventDate })
      .execute();

    res.status(200).send("Successful User Creation");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving users");
  }
});

export default setDayData;
