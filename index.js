const { StargateClient, SigningStargateClient } = require("@cosmjs/stargate");
const { Registry, DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { readFile} = require("fs/promises");
const { Tx } = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const { MsgSend } = require("cosmjs-types/cosmos/bank/v1beta1/tx");
const { MsgSubmitEvidence } = require("cosmjs-types/cosmos/evidence/v1beta1/tx");
const { MsgSubmitProposal } = require("cosmjs-types/cosmos/gov/v1beta1/tx");
const { v4: uuidv4 } = require('uuid');

// Register evidence
const types = [
    ["/cosmos.evidence.v1beta1.MsgSubmitEvidence", MsgSubmitEvidence],
    ["/cosmos.gov.v1beta1.MsgSubmitProposal", MsgSubmitProposal]
];
const registry = new Registry(types);

// RPC connection
const rpc = "https://rpc.sentry-01.theta-testnet.polypore.xyz";

// returns an OfflineDirectSigner from mnemonic
const getUserSignerFromMnemonic = async () => {
    return DirectSecp256k1HdWallet.fromMnemonic((await readFile("./testnet.user.mnemonic.key")).toString(), {
        prefix: "cosmos", // testnet address prefix
    })
}

const sendMessage = async() => {
    // Initialize connection and check you connected to the right place
    const client = await StargateClient.connect(rpc);
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight());

    // Faucet (test tokens) hash, taken from link returned by bot
    const faucetTx = await client.getTx("689DF391591064DA6D9310586776544A0F2CC8BF00B4E4C4519BEDD3EB350423");
    // decode transaction message
    const decodedTx = Tx.decode(faucetTx.tx)
    const sendMessage = MsgSend.decode(decodedTx.body.messages[0].value)
    // get the faucet address from "fromAddress" in MsgSend
    const faucet = sendMessage.fromAddress

    const userSigner  = await getUserSignerFromMnemonic()
    // get user address
    const user = (await userSigner.getAccounts())[0].address
    // create signing client that is able to do transactions, for Read-Only -> StargateClient
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, userSigner)

    // define message
    const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
            fromAddress: user,
            toAddress: faucet,
            amount: [
                { denom: "uatom", amount: "100000" },
            ],
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
    console.log("Send tokens result:", result)
}

const submitProposal = async() => {
    // Initialize connection and check you connected to the right place
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())

    const wallet = await getUserSignerFromMnemonic()
    // create signing client that is able to do transactions, for Read-Only -> StargateClient
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, wallet, { registry })

    // get user address
    const userAddress = (await wallet.getAccounts())[0].address

    // define message
    const msg = {
        typeUrl: "/cosmos.gov.v1beta1.MsgSubmitProposal",
        value: {
            content: "test",
            initialDeposit: [{ denom: "uatom", amount: "500" }],
            proposer: userAddress,
        },
    }

    // define fee
    const fee = {
        amount: [{ denom: "uatom", amount: "500" }],
        gas: "200000",
    }


    const result = await signingClient.signAndBroadcast(
        // the signerAddress
        userAddress,
        // the message(s)
        [ msg ],
        // the fee
        fee,
    )
    
    // Output the result of the Tx
    console.log("Register proposal result:", result)
}

const submitEvidence = async() => {
    // Initialize connection and check you connected to the right place
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())

    const wallet = await getUserSignerFromMnemonic()
    // create signing client that is able to do transactions, for Read-Only -> StargateClient
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, wallet, { registry })

    // just for testing purposes, the device CHID is an UUID
    const deviceCHID = uuidv4();

    // get user address
    const userAddress = (await wallet.getAccounts())[0].address

    // define message
    const msg = {
        typeUrl: "/cosmos.evidence.v1beta1.MsgSubmitEvidence",
        value: {
            submitter: userAddress,
            evidence: deviceCHID,
        },
    }

    // define fee
    const fee = {
        amount: [{ denom: "uatom", amount: "500" }],
        gas: "200000",
    }

    const result = await signingClient.signAndBroadcast(
        // the signerAddress
        userAddress,
        // the message(s)
        [ msg ],
        // the fee
        fee,
    )
    
    // Output the result of the Tx
    console.log("Register proposal result:", result)
}

submitProposal()