import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const bcrypt = require('bcrypt');

async function main() {

  const hashedAlicePassword = await bcrypt.hash('alice', 10);
  const hashedBobPassword = await bcrypt.hash('bob', 10);

  const alice = await prisma.user.upsert({
    where: { number: '9999999999' },
    update: {
      password: hashedAlicePassword,
      name: 'alice',
    },
    create: {
      number: '9999999999',
      password: hashedAlicePassword,
      name: 'alice',
      OnRampTransaction: {
        create: {
          startTime: new Date(),
          status: "Success",
          amount: 20000,
          token: "122",
          provider: "HDFC Bank",
        },
      },
    },
  })
  const bob = await prisma.user.upsert({
    where: { number: '9999999998' },
    update: {
      password: hashedBobPassword,
      name: 'bob',
    },
    create: {
      number: '9999999998',
      password: hashedBobPassword,
      name: 'bob',
      OnRampTransaction: {
        create: {
          startTime: new Date(),
          status: "Failure",
          amount: 2000,
          token: "123",
          provider: "HDFC Bank",
        },
      },
    },
  })
  console.log({ alice, bob })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })