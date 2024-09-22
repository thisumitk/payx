"use client";

import { useBalance } from "@repo/store/useBalance";

function Balance() {
    const value = useBalance();
    console.log(value)
    return <p>The current balance is {value}</p>;
}

export default Balance;