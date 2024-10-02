import client from "@repo/db/client";
import { AddMoney } from "../../../../../components/AppdMoneyCard";
import { BalanceCard } from "../../../../../components/BalanceCard";
import { OnRampTransactions } from "../../../../../components/OnRampTransactions";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../user-app/app/lib/auth";
import { redirect } from 'next/navigation'

interface OnRampT {
    startTime: Date; 
    amount: number; 
    status: string;
    provider: string;
    
}

async function getBalance() {
    
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    else {
    const userId = session?.user?.id;
    console.log("User ID:", userId, "Type:", typeof userId);

    const balance = await client.balance.findFirst({
        where: {
            userId: Number(session?.user?.id)
        } 
    });
    return {
        amount: balance?.amount || 0,
        locked: balance?.locked || 0
       
    }}
}

async function getOnRampTransactions() {
    const session = await getServerSession(authOptions);
   
   const txns : OnRampT []= await client.onRampTransaction.findMany({
        where: {
            userId: Number(session?.user?.id)
        }
    });

   return txns.map((t : OnRampT) => ({
        time: t.startTime,
        amount: t.amount,
        status: t.status,
        provider: t.provider
    }))

}

export default async function() {
    
    const balance = await getBalance();
    const transactions = await getOnRampTransactions();

    return <div className="w-screen">
        <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">
            Transfer
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
            <div>
                <AddMoney />
            </div>
            <div>
                
                <BalanceCard amount={balance.amount} locked={balance.locked} />
                <div className="pt-4">
                    <OnRampTransactions transactions={transactions} />
                </div>
            </div>
        </div>
    </div>
}