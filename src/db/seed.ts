/* eslint-disable drizzle/enforce-delete-with-where */

import { faker } from '@faker-js/faker'
import { users, restaurants, authLinks, orders, orderItems, products } from './schema'
import { db } from './connection'
import chalk from 'chalk';
import { createId } from '@paralleldrive/cuid2';

// Reseting database
await db.delete(users);
await db.delete(restaurants);
await db.delete(orderItems);
await db.delete(orders);
await db.delete(products);
await db.delete(authLinks);


console.log(chalk.yellow('✔ Database reset!'));

const [customer1, customer2] = await db.insert(users).values([
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'customer',
  },
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'customer',
  },
]).returning();

console.log(chalk.yellow('✔ Created customers'));

const [manager] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: 'admin@admin.com',
      role: 'manager',
    },
  ])
  .returning({ id: users.id })

console.log(chalk.yellow('✔ Manager created!'));

const [restaurant] = await db.insert(restaurants).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    managerId: manager?.id,
  },
]).returning({ id: restaurants.id });

if (!restaurant) throw new Error("Failed to create restaurant");

/**
 * Create products
 */
const avaliableProducts = await db.insert(products).values([
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
]).returning();

console.log(chalk.yellow("✔ Created products!"));

/**
 * Create orders
 */

type OrderItemInsert = typeof orderItems.$inferInsert;
type OrderInsert = typeof orders.$inferInsert;

const orderItemsToInsert: OrderItemInsert[] = [];
const ordersToInsert: OrderInsert[] = [];

for(let i = 0; i < 200; i++){
  const orderId = createId();

  const orderProducts = faker.helpers.arrayElements(avaliableProducts, { min: 1, max: 3 });

  let totalInCents = 0;

  orderProducts.forEach(orderProduct => {
    const quantity = faker.number.int({ min: 1, max: 3 });
    totalInCents += orderProduct.priceInCents * quantity;

    orderItemsToInsert.push({
      orderId,
      priceInCents: orderProduct.priceInCents,
      quantity,
      productId: orderProduct.id
    });
  });

  ordersToInsert.push({
    id: orderId,
    customerId: faker.helpers.arrayElement([customer1?.id, customer2?.id]),
    restaurantId: restaurant.id,
    totalInCents,
    status: faker.helpers.arrayElement([
      "pending",
      "processing",
      "delivering",
      "delivered",
      "cancelled",
    ]),
    created_at: faker.date.recent({ days: 40 })
  });
}

await db.insert(orders).values(ordersToInsert);
await db.insert(orderItems).values(orderItemsToInsert);

console.log(chalk.yellow('✔ Created orders!'));

console.log(chalk.greenBright('✔ Database seeded successfully!'));

process.exit();


function generateProduct() {
  if (!restaurant) {
    throw new Error("Restaurant is undefined when generating product");
  }
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    restaurantId: restaurant.id,
    priceInCents: Number(faker.commerce.price({ min: 190, max: 490, dec: 0 })),
  };
};