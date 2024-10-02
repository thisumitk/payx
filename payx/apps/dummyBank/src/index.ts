import express from "express";
import client from "@repo/db/client";

const app = express();


app.use(express.json());

app.post("/hdfcWebHook", async (req, res) => {
    const paymentInformation = {
        token: req.body.token,
        userId: req.body.userId,
        amount: req.body.amount,
    };

    console.log(`User ID: ${paymentInformation.userId}, Amount: ${paymentInformation.amount}`);

    const existingBalance = await client.balance.findUnique({
        where: {
            userId: Number(paymentInformation.userId),
        },
    });

    const transactionSteps = [];

    try {
        if (existingBalance) {
            // Push the update operation to the transaction steps
            transactionSteps.push(
                client.balance.update({
                    where: {
                        userId: Number(paymentInformation.userId),
                    },
                    data: {
                        amount: {
                            increment: Number(paymentInformation.amount),
                        },
                    },
                })
            );
        } else {
            // Push the create operation to the transaction steps
            transactionSteps.push(
                client.balance.create({
                    data: {
                        userId: Number(paymentInformation.userId),
                        amount: Number(paymentInformation.amount),
                        locked: 0,
                    },
                })
            );
        }

        // Always push the update for the transaction status
        transactionSteps.push(
            client.onRampTransaction.updateMany({
                where: {
                    token: paymentInformation.token,
                },
                data: {
                    status: "Success",
                },
            })
        );

        // Execute all the transaction steps
        await client.$transaction(transactionSteps);

        // Fetch and log the updated balance
        const userBalance = await client.balance.findUnique({
            where: {
                userId: Number(paymentInformation.userId),
            },
        });
        console.log('Updated User Balance:', userBalance);

        res.json({
            message: "Payment Received",
        });
    } catch (e) {
        console.error(e);
        res.status(411).json({
            message: "Error while processing webhook",
        });
    }
});

app.listen(3003, () => {
    console.log("Server is running on port 3003");
});
