import Elysia from "elysia";
import { auth } from "../auth";
import UnauthorizedError from "../errors/unauthorized-error";
import dayjs from "dayjs";
import { db } from "../../db/connection";
import { orders } from "../../db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";

export const getDayOrdersAmount = new Elysia()
  .use(auth)
  .get("/metrics/day-orders-amount", async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const yesterday = today.subtract(1, "day");
    const startOfYesterday = yesterday.startOf("day");

    const orderPerDay = await db
      .select({
        amount: count(),
        dayWithMonthAndYear: sql<string>`TO_CHAR(${orders.created_at}, 'YYYY-MM-DD')`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.created_at, startOfYesterday.toDate())
        )
      )
      .groupBy(sql`TO_CHAR(${orders.created_at}, 'YYYY-MM-DD')`);

    const todayWithMonthAndYear = today.format('YYYY-MM-DD');
    const yesterdayWithMonthAndYear = yesterday.format('YYYY-MM-DD');

    const todayReceipt = orderPerDay.find((orderPerDay) => {
      return orderPerDay.dayWithMonthAndYear === todayWithMonthAndYear;
    });

    const yesterdayReceipt = orderPerDay.find((orderPerDay) => {
      return orderPerDay.dayWithMonthAndYear === yesterdayWithMonthAndYear;
    });

    const diffFromYesterday =
      todayReceipt && yesterdayReceipt
        ? (todayReceipt.amount * 100) / yesterdayReceipt.amount
        : null;

    return {
      amount: todayReceipt?.amount,
      diffFromYesterday: diffFromYesterday
        ? Number((diffFromYesterday - 100).toFixed(2))
        : 0,
    };

    return orderPerDay;
  });
