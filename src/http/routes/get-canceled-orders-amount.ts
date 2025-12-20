import Elysia from "elysia";
import { auth } from "../auth";
import UnauthorizedError from "../errors/unauthorized-error";
import dayjs from "dayjs";
import { db } from "../../db/connection";
import { orders } from "../../db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";

export const getCanceledMonthOrdersAmount = new Elysia()
  .use(auth)
  .get("/metrics/canceled-month-orders-amount", async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const lastMonth = today.subtract(1, "month");
    const startOfLastMonth = lastMonth.startOf("month");

    const lastMonthWithYear = lastMonth.format("YYYY-MM");
    const currentMonthWithYear = today.format("YYYY-MM");

    const orderPerMonth = await db
      .select({
        amount: count(),
        monthWithYear: sql<string>`TO_CHAR(${orders.created_at}, 'YYYY-MM')`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.created_at, startOfLastMonth.toDate()),
          eq(orders.status, "cancelled")
        )
      )
      .groupBy(sql`TO_CHAR(${orders.created_at}, 'YYYY-MM')`);

    const currentMonthOrdersAmount = orderPerMonth.find(orderPerMonth => {
      return orderPerMonth.monthWithYear === currentMonthWithYear;
    });

    const lastMonthOrdersAmount = orderPerMonth.find((orderPerMonth) => {
      return orderPerMonth.monthWithYear === lastMonthWithYear;
    });

    const diffFromLastMonth = currentMonthOrdersAmount && lastMonthOrdersAmount
      ? (currentMonthOrdersAmount.amount * 100) / lastMonthOrdersAmount.amount
      : null

    return {
      amount: currentMonthOrdersAmount?.amount,
      diffFromLastMonth: diffFromLastMonth ? Number((diffFromLastMonth - 100).toFixed(2)) : 0
    };
  });
