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

    console.log('=== MahdiToken Admin Functions ===');
    console.log('Contract:', contractAddress.toString());
    console.log('Admin:', sender.address.toString());
    console.log();

    // Display current contract state
    console.log('=== Current State ===');
    const totalSupply = await token.getGetTotalSupply();
    const adminBalance = await token.getBalanceOf(sender.address);
    const accumulatedFees = await token.getGetAccumulatedFees();
    const transfersEnabled = await token.getAreTransfersEnabled();
    const feePercentage = await token.getGetFeePercentage();

    console.log('Total Supply:', formatAmount(totalSupply));
    console.log('Admin Balance:', formatAmount(adminBalance));
    console.log('Accumulated Fees:', formatAmount(accumulatedFees));
    console.log('Transfers Enabled:', transfersEnabled);
    console.log('Fee Percentage:', (Number(feePercentage) / 100).toFixed(2) + '%');
    console.log();

    // Example admin operations - uncomment as needed

    /*
    // 1. Update fee percentage
    console.log('Updating fee percentage to 0.5%...');
    const setFeeResult = await token.send(
        sender,
        { value: toNano('0.05') },
        { $$type: 'SetFee', feePercentage: 50n } // 0.5% in basis points
    );
    console.log('Fee updated successfully');
    */

    /*
    // 2. Toggle transfers
    console.log('Toggling transfers...');
    const toggleResult = await token.send(
        sender,
        { value: toNano('0.05') },
        { $$type: 'ToggleTransfers', enabled: false }
    );
    console.log('Transfers toggled successfully');
    */

    /*
    // 3. Mint new tokens
    const recipientAddress = Address.parse('RECIPIENT_ADDRESS_HERE');
    const mintAmount = toNano('1000');
    console.log(`Minting ${formatAmount(mintAmount)} to ${recipientAddress.toString()}...`);
    const mintResult = await token.send(
        sender,
        { value: toNano('0.05') },
        { $$type: 'Mint', to: recipientAddress, amount: mintAmount }
    );
    console.log('Tokens minted successfully');
    */

    /*
    // 4. Burn tokens
    const burnAddress = Address.parse('ADDRESS_TO_BURN_FROM');
    const burnAmount = toNano('100');
    console.log(`Burning ${formatAmount(burnAmount)} from ${burnAddress.toString()}...`);
    const burnResult = await token.send(
        sender,
        { value: toNano('0.05') },
        { $$type: 'Burn', from: burnAddress, amount: burnAmount }
    );
    console.log('Tokens burned successfully');
    */

    /*
    // 5. Withdraw accumulated fees
    const withdrawAmount = accumulatedFees;
    console.log(`Withdrawing ${formatAmount(withdrawAmount)} in fees...`);
    const withdrawResult = await token.send(
        sender,
        { value: toNano('0.05') },
        { $$type: 'WithdrawFees', amount: withdrawAmount }
    );
    console.log('Fees withdrawn successfully');
    */

    /*
    // 6. Change admin
    const newAdminAddress = Address.parse('NEW_ADMIN_ADDRESS_HERE');
    console.log(`Changing admin to ${newAdminAddress.toString()}...`);
    const changeAdminResult = await token.send(
        sender,
        { value: toNano('0.05') },
        { $$type: 'ChangeAdmin', newAdmin: newAdminAddress }
    );
    console.log('Admin changed successfully');
    */

    /*
    // 7. Freeze/unfreeze user
    const userToFreeze = Address.parse('USER_ADDRESS_TO_FREEZE');
    console.log(`Toggling freeze status for ${userToFreeze.toString()}...`);
    const freezeResult = await token.send(
        sender,
        { value: toNano('0.05') },
        userToFreeze
    );
    console.log('Freeze status toggled successfully');
    */

    console.log('=== Admin Functions Complete ===');
}

function formatAmount(amount: bigint): string {
    return (Number(amount) / 1e9).toLocaleString() + ' MHD';
}

// Helper function to run specific admin operations
export async function runAdminOperation(
    provider: NetworkProvider,
    operation: string,
    params: any
) {
    const sender = provider.sender();
    const contractAddress = Address.parse(params.contractAddress);
    const token = provider.open(MahdiToken.fromAddress(contractAddress));

    switch (operation) {
        case 'setFee':
            return await token.send(
                sender,
                { value: toNano('0.05') },
                { $$type: 'SetFee', feePercentage: BigInt(params.feePercentage) }
            );

        case 'toggleTransfers':
            return await token.send(
                sender,
                { value: toNano('0.05') },
                { $$type: 'ToggleTransfers', enabled: params.enabled }
            );

        case 'mint':
            return await token.send(
                sender,
                { value: toNano('0.05') },
                { $$type: 'Mint', to: Address.parse(params.to), amount: toNano(params.amount) }
            );

        case 'burn':
            return await token.send(
                sender,
                { value: toNano('0.05') },
                { $$type: 'Burn', from: Address.parse(params.from), amount: toNano(params.amount) }
            );

        case 'withdrawFees':
            return await token.send(
                sender,
                { value: toNano('0.05') },
                { $$type: 'WithdrawFees', amount: toNano(params.amount) }
            );

        case 'changeAdmin':
            return await token.send(
                sender,
                { value: toNano('0.05') },
                { $$type: 'ChangeAdmin', newAdmin: Address.parse(params.newAdmin) }
            );

        case 'toggleFreeze':
            return await token.send(
                sender,
                { value: toNano('0.05') },
                Address.parse(params.address)
            );

        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}