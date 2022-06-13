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

import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"
import { IndexedTx, StargateClient, SigningStargateClient } from "@cosmjs/stargate"   // transaction, read-only client, signing client
import { readFile } from "fs/promises"  // to read user private key 
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"  // deserialize transaction
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx" // deserialize MsgSend

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

    // Faucet (test tokens) hash, taken from link returned by bot
    const faucetTx: IndexedTx = (await client.getTx(
        "689DF391591064DA6D9310586776544A0F2CC8BF00B4E4C4519BEDD3EB350423",
    ))!
    // decode transaction message
    const decodedTx: Tx = Tx.decode(faucetTx.tx)
    const message: MsgSend = MsgSend.decode(decodedTx.body!.messages[0].value)
    // get the faucet address from "fromAddress" in MsgSend
    const faucet: string = message.fromAddress

    // get user address
    const user = (await wallet.getAccounts())[0].address

    // define message
    const msg = {
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value: {
            delegatorAddress: user,
            validatorAddress: faucet,
            amount: { denom: "uatom", amount: "1000", },
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