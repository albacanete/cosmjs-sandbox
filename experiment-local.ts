/*
This file has been created following the tutorial at: https://tutorials.cosmos.network/academy/5-cosmjs/first-steps.html
SENDING A TRANSACTION WITH A SINGLE MESSAGE
*/

// StargateClient ONLY QUERY, NO SENDING TRANSACTIONS
import { IndexedTx, StargateClient, SigningStargateClient } from "@cosmjs/stargate"   // transaction, read-only client, signing client
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"  // deserialize transaction
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx" // deserialize MsgSend
import { readFile } from "fs/promises"  // to read Alice private key
// import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing" 
import { DirectSecp256k1Wallet, OfflineDirectSigner } from "@cosmjs/proto-signing"
import { fromHex } from "@cosmjs/encoding"

// RPC connection
const rpc = "http://127.0.0.1:26657"

// returns an OfflineDirectSigner from private key
const getAliceSignerFromPriKey = async(): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1Wallet.fromKey(
        fromHex((await readFile("./simd.alice.private.key")).toString()),
        "cosmos",
    )
}

const runAll = async(): Promise<void> => {
    // Initialize connection and check you connected to the right place
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())
    
    /*
    ./simd keys show bob
    - name: bob
    type: local
    address: cosmos1ygl5ju8vggh76e2p8fyqc7ka4xm65n32ju9ml2
    pubkey: cosmospub1addwnpepqf0av5gp986uq7q2rd8alxpdpu26h5umreeuyd4d8t3ypdzhwdkhsmvmkgk
    mnemonic: ""
    threshold: 0
    pubkeys: []
    */
    const bob: string = "cosmos1ygl5ju8vggh76e2p8fyqc7ka4xm65n32ju9ml2"
    // get faucet balance
    console.log("Bob balances:", await client.getAllBalances(bob))

    /* try for Alice to send some tokens back to the faucet */
    //  for Alice to send transactions, she needs to be able to sign them (private keys or mnemonics) 
    // or needs a client that has access to those. -> SigningStargateClient
    const aliceSigner: OfflineDirectSigner = await getAliceSignerFromPriKey()
    // check it recovers Alice's address 
    const alice = (await aliceSigner.getAccounts())[0].address
    console.log("Alice's address from signer", alice)
    // create signing client
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, aliceSigner)
    // check it works like StargateClient
    console.log(
        "With signing client, chain id:",
        await signingClient.getChainId(),
        ", height:",
        await signingClient.getHeight()
    )
    // send 1% of her holdings
    // Check the balance of Alice and the Faucet
    console.log("Alice balance before:", await client.getAllBalances(alice))
    console.log("Bob balance before:", await client.getAllBalances(bob))
    // Execute the sendTokens Tx and store the result
    const result = await signingClient.sendTokens(
        alice,
        bob,
        [{ denom: "stake", amount: "100000"}],
        {
            amount: [{ denom: "stake", amount: "500" }],
            gas: "200000",
        },
    )
    // Output the result of the Tx
    console.log("Transfer result:", result)
    // Check both balances again
    console.log("Alice balance after:", await client.getAllBalances(alice))
    console.log("Bob balance after:", await client.getAllBalances(bob))
}

runAll()

