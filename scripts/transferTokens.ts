import { toNano, Address } from '@ton/core';
import { MahdiToken } from '../build/MahdiToken/MahdiToken_MahdiToken';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    
    if (!sender.address) {
        throw new Error('Sender address is required');
    }

    // Replace with your deployed contract address
    const contractAddress = Address.parse('YOUR_CONTRACT_ADDRESS_HERE');
    const token = provider.open(MahdiToken.fromAddress(contractAddress));

    // Example: Transfer 1000 MHD tokens to another address
    const recipientAddress = Address.parse('RECIPIENT_ADDRESS_HERE');
    const transferAmount = toNano('1000'); // 1000 MHD tokens

    console.log('Transferring tokens...');
    console.log('From:', sender.address.toString());
    console.log('To:', recipientAddress.toString());
    console.log('Amount:', transferAmount.toString());

    const transferResult = await token.send(
        sender,
        { value: toNano('0.05') },
        {
            $$type: 'Transfer',
            to: recipientAddress,
            amount: transferAmount,
            response_destination: null,
            custom_payload: null,
            forward_ton_amount: 0n,
            forward_payload: Buffer.alloc(0)
        }
    );

    console.log('Transfer completed!');
    
    // Check balances after transfer
    const senderBalance = await token.getBalanceOf(sender.address);
    const recipientBalance = await token.getBalanceOf(recipientAddress);
    const accumulatedFees = await token.getGetAccumulatedFees();

    console.log('Sender balance:', formatAmount(senderBalance));
    console.log('Recipient balance:', formatAmount(recipientBalance));
    console.log('Accumulated fees:', formatAmount(accumulatedFees));
}

function formatAmount(amount: bigint): string {
    return (Number(amount) / 1e9).toLocaleString() + ' MHD';
}