/*
This file has been created following the tutorial at: https://tutorials.cosmos.network/academy/5-cosmjs/first-steps.html
*/

// StargateClient ONLY QUERY, NO SENDING TRANSACTIONS
import { IndexedTx, StargateClient, SigningStargateClient } from "@cosmjs/stargate"   // transaction, read-only client, signing client
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"  // deserialize transaction
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx" // deserialize MsgSend
import { readFile } from "fs/promises"  // to read Alice private key
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"    

// RPC connection
const rpc = "https://rpc.sentry-01.theta-testnet.polypore.xyz"

// returns an OfflineDirectSigner from mnemonic
const getAliceSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1HdWallet.fromMnemonic((await readFile("./testnet.alice.mnemonic.key")).toString(), {
        prefix: "cosmos", // testnet address prefix
    })
}

const runAll = async(): Promise<void> => {
    // Initialize connection and check you connected to the right place
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())
    
    /* GET USER BALANCE (in this case, the user is Alice, created with generate_mnemonic.ts) */
    // getAllBalances is used because the default token name is not yet known
    console.log(
        "Alice balances:",
        await client.getAllBalances("cosmos1npr6ee2ww5rxe5nmtzvyxktvk8mvpjxwkxfs4j"), // id gotten from generate_mnemonic.ts
    )
    // output to npm run experiment: Alice balances: []

    // If the account is newly created, balance is 0. 
    // To earn in testnet, expose *faucets*: services that send you test tokens for free, within limits
    // Request faucets at: https://discord.com/invite/cosmosnetwork channel testnet-faucnet
    // command: $request cosmos1npr6ee2ww5rxe5nmtzvyxktvk8mvpjxwkxfs4j theta
    // a bot returns a link, in my case:
    // https://explorer.theta-testnet.polypore.xyz/transactions/EBB06EEC109E30F3D157099B35D5E8CDBC9D8C6C9DA798DFC93C894163A40E2C
    // output to npm run experiment: Alice balances: [ { denom: 'uatom', amount: '10000000' } ]

    /* GET FAUCET ADDRESS */
    // Faucet hash, taken from link returned by bot
    const faucetTx: IndexedTx = (await client.getTx(
        "EBB06EEC109E30F3D157099B35D5E8CDBC9D8C6C9DA798DFC93C894163A40E2C",
    ))!

    /* DESERIALIZE TRANSACTION */
    // console.log("Faucet Tx:", faucetTx)
    const decodedTx: Tx = Tx.decode(faucetTx.tx)
    console.log("DecodedTx:", decodedTx)
    // faucet address information is inside the body.messages
    console.log("Decoded messages:", decodedTx.body!.messages)
    // ! The transaction deserializer knows how to properly decode any transaction, but it does not know how to do the same for messages.
    // from output: typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    
    /* DESERIALIZE MESSAGE (of type MsgSend) */
    const sendMessage: MsgSend = MsgSend.decode(decodedTx.body!.messages[0].value)
    console.log("Sent message:", sendMessage)
    // we get the faucet address from "fromAddress" in the output
    const faucet: string = sendMessage.fromAddress
    // get faucet balance
    console.log("Faucet balances:", await client.getAllBalances(faucet))

    /* try for Alice to send some tokens back to the faucet */
    //  for Alice to send transactions, she needs to be able to sign them (private keys or mnemonics) 
    // or needs a client that has access to those. -> SigningStargateClient
    const aliceSigner: OfflineDirectSigner = await getAliceSignerFromMnemonic()
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
    // discover how much gas Alice has to spend to send tokens to the faucet and its price
    console.log("Gas fee:", decodedTx.authInfo!.fee!.amount)
    console.log("Gas limit:", decodedTx.authInfo!.fee!.gasLimit.toString(10))
    // send 1% of her holdings
    // Check the balance of Alice and the Faucet
    console.log("Alice balance before:", await client.getAllBalances(alice))
    console.log("Faucet balance before:", await client.getAllBalances(faucet))
    // Execute the sendTokens Tx and store the result
    const result = await signingClient.sendTokens(
        alice,
        faucet,
        [{ denom: "uatom", amount: "100000"}],
        {
            amount: [{ denom: "uatom", amount: "500" }],
            gas: "200000",
        },
    )
    // Output the result of the Tx
    console.log("Transfer result:", result)
    // Check both balances again
    console.log("Alice balance after:", await client.getAllBalances(alice))
    console.log("Faucet balance after:", await client.getAllBalances(faucet))
}

runAll()

