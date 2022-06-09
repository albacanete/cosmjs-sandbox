import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"

// You need a wallet address on the testnet and you must create a 24-word mnemonic in order to do so. CosmJS can generate one for you. 
// key is created with the command: npx ts-node generate_mnemonic.ts > testnet.alice.mnemonic.key
const generateKey = async (): Promise<void> => {
    const wallet: DirectSecp256k1HdWallet = await DirectSecp256k1HdWallet.generate(24)
    // process.stdout.write was used to avoid any line return. Be careful not to add any empty lines or any other character in your .key file 
    // (this occurs with VSCode under certain conditions). If you add any characters, ComsJs may not be able to parse it.
    process.stdout.write(wallet.mnemonic)
    const accounts = await wallet.getAccounts()
    console.error("Mnemonic with 1st account:", accounts[0].address)
}

generateKey()
