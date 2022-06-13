/*
Implementation of operations in the Cosmos network testnet

Before running the script:
1. Generate user key running: npm run generate 
        it returns the 24 words, that have to be saved in ./testnet.user.mnemonic.key
        user address, used to generate the faucet access
2. Request faucets in Discord: https://discord.com/invite/cosmosnetwork channel testnet-faucnet
        command: $request $user_address theta
        example link: https://explorer.theta-testnet.polypore.xyz/transactions/689DF391591064DA6D9310586776544A0F2CC8BF00B4E4C4519BEDD3EB350423
3. Use hash in link returned by bot in faucetTx variable        
*/

import { DirectSecp256k1Wallet, OfflineDirectSigner } from "@cosmjs/proto-signing"
import { IndexedTx, StargateClient, SigningStargateClient } from "@cosmjs/stargate"   // transaction, read-only client, signing client
import { readFile } from "fs/promises"  // to read user private key 
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

const sendMessage = async(): Promise<void> => {
    // Initialize connection and check you connected to the right place
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())

    const wallet: OfflineDirectSigner = await getAliceSignerFromPriKey()
    // check it recovers Alice's address 
    const alice = (await wallet.getAccounts())[0].address
    // create signing client
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, wallet)

    // bob account
    const bob: string = "cosmos1ygl5ju8vggh76e2p8fyqc7ka4xm65n32ju9ml2"

    // define message
    const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
            fromAddress: alice,
            toAddress: bob,
            amount: [
                { denom: "stake", amount: "100" },
            ],
        },
    }

    // define fee
    const fee = {
        amount: [{ denom: "stake", amount: "500" }],
        gas: "200000",
    }

    const result = await signingClient.signAndBroadcast(
        alice,
        [ msg ],
        fee,
    )
    
    // Output the result of the Tx
    console.log("Send tokens result:", result)
}

sendMessage()