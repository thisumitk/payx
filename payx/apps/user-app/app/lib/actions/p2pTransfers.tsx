"use server"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import client from "@payx/db/client";

export async function p2pTransfer(to: string, amount: number) {
    const session = await getServerSession(authOptions);
    const from = session?.user?.id;
    if (!from) {
        return {
            message: "Error while sending"
        }
    }
    const toUser = await client.user.findFirst({
        where: {
            number: to
        }
    });

    if (!toUser) {
        return {
            message: "User not found"
            
        }
    }

    const existingBalance = await client.balance.findUnique({
        where: {
            userId: Number(toUser.id),
        },    
    });

    await client.$transaction(async (tx) => {
        const fromBalance = await tx.balance.findUnique({
            where: { userId: Number(from) },
          });
          if (!fromBalance || fromBalance.amount < amount) {
            throw new Error('Insufficient funds');
          }

          if(!existingBalance){
            await client.balance.create({
                data: {
                    userId: Number(toUser.id),
                    amount: Number(0),
                    locked: 0,
                },
            });
          }

          await tx.balance.update({
            where: { userId: Number(from) },
            data: { amount: { decrement: amount } },
          });

          await tx.balance.update({
            where: { userId: toUser.id },
            data: { amount: { increment: amount } },
          });
    });
}