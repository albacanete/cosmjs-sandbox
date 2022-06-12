/*
Implementation of operations in the Cosmos network testnet

Before running the script:
1. Generate user key running: npm run generate 
        it returns the 24 words, that have to be saved in ./testnet.user.mnemonic.key
        user address, used to generate the faucet access      
*/

import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"
import { StargateClient, SigningStargateClient } from "@cosmjs/stargate"   // transaction, read-only client, signing client
import { readFile } from "fs/promises"  // to read user private key 
import { v4 as uuidv4}  from "uuid"

// RPC connection
const rpc = "https://rpc.sentry-01.theta-testnet.polypore.xyz"

// returns an OfflineDirectSigner from mnemonic
const getUserSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1HdWallet.fromMnemonic((await readFile("./testnet.user.mnemonic.key")).toString(), {
        prefix: "cosmos", // testnet address prefix
    })
}

const userDelegate = async(): Promise<void> => {
    // Initialize connection and check you connected to the right place
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())

    const wallet: OfflineDirectSigner = await getUserSignerFromMnemonic()
    // create signing client that is able to do transactions, for Read-Only -> StargateClient
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, wallet)

    // get user address
    const user = (await wallet.getAccounts())[0].address

    // for test, randomly create CHID
    const chid = uuidv4()

    // define message
    const msg = {
        typeUrl: "/cosmos.gov.v1beta1.MsgSubmitProposal",
        value: {
            content: chid,
            initialDeposit: [{ denom: "uatom", amount: "500" }],
            proposer: user
        },
}

    // define fee
    const fee = {
        amount: [{ denom: "uatom", amount: "500" }],
        gas: "200000",
    }


    const result = await signingClient.signAndBroadcast(
        // the signerAddress
        user,
        // the message(s)
        [ msg ],
        // the fee
        fee,
    )
    
    // Output the result of the Tx
    console.log("User delegate result:", result)
}

userDelegate()