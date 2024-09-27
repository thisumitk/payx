import express from "express";
import client from "@payx/db/client";

const app = express();

app.use(express.json());

app.post("/hdfcWebHook", async(req,res) => {

    const paymentInformation:{

        token : string;
        userId: string;
        amount: string;
    } = {

        token: req.body.token,
        userId: req.body.userId,
        amount: req.body.amount
    };

try {
    await client.$transaction([
        client.balance.updateMany({
            where: {
                userId: Number(paymentInformation.userId)
            },
            data: {
                amount: {
                    
                    increment: Number(paymentInformation.amount)
                }
            }
        }),
        client.onRampTransaction.updateMany({
            where: {
                token: paymentInformation.token
            }, 
            data: {
                status: "Success",
            }
        })
    ]);

    res.json({
        message: "Payment Recieved"
    })
} catch(e) {
    console.error(e);
    res.status(411).json({
        message: "Error while processing webhook"
    })
}
})

app.listen(3003);