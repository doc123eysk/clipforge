const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "doc.123.eysk@gmail.com";
  const code = String(Math.floor(100000 + Math.random() * 900000));

  await prisma.authCode.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });

  console.log("Email:", email);
  console.log("Code:", code);
  await prisma.$disconnect();
}

main();
