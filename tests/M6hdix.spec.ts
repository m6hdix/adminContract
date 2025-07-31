import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell, Cell } from '@ton/core';
import { MahdiToken } from '../build/MahdiToken/MahdiToken_MahdiToken';
import '@ton/test-utils';

describe('MahdiToken', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let token: SandboxContract<MahdiToken>;
    
    const totalSupply = 1_000_000_000_000_000n; // 1M tokens with 9 decimals
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        
        token = blockchain.openContract(
            await MahdiToken.fromInit()
        );
        
        const deployResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Deploy', queryId: 0n }
        );
        
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            deploy: true,
            success: true,
        });
    });
    
    it('should deploy correctly with initial supply', async () => {
        const adminBalance = await token.getBalanceOf(deployer.address);
        expect(adminBalance).toEqual(totalSupply);
        
        const totalSupplyResult = await token.getGetTotalSupply();
        expect(totalSupplyResult).toEqual(totalSupply);
        
        const metadata = await token.getGetMetadata();
        expect(metadata.name).toBe('Mahdi');
        expect(metadata.symbol).toBe('MHD');
        expect(Number(metadata.decimals)).toBe(9);
        expect(metadata.totalSupply).toEqual(totalSupply);
    });
    
    it('should transfer tokens with fee deduction', async () => {
        const transferAmount = toNano('1000'); // 1000 tokens
        const feePercentage = 10n; // 0.1%
        const expectedFee = (transferAmount * feePercentage) / 10_000n;
        const expectedNetAmount = transferAmount - expectedFee;
        
        // Initial balances
        const deployerInitialBalance = await token.getBalanceOf(deployer.address);
        const user1InitialBalance = await token.getBalanceOf(user1.address);
        
        // Perform transfer
        const transferResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'Transfer',
                to: user1.address,
                amount: transferAmount,
                response_destination: null,
                custom_payload: null,
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );
        
        expect(transferResult.transactions).toHaveTransaction({
            success: true,
        });
        
        // Check balances after transfer
        const deployerFinalBalance = await token.getBalanceOf(deployer.address);
        const user1FinalBalance = await token.getBalanceOf(user1.address);
        const accumulatedFees = await token.getGetAccumulatedFees();
        
        expect(deployerFinalBalance).toEqual(deployerInitialBalance - transferAmount);
        expect(user1FinalBalance).toEqual(user1InitialBalance + expectedNetAmount);
        expect(accumulatedFees).toEqual(expectedFee);
    });
    
    it('should allow admin to toggle transfers', async () => {
        // Initially transfers should be enabled
        const transfersEnabled = await token.getAreTransfersEnabled();
        expect(transfersEnabled).toBe(true);
        
        // Disable transfers
        const disableResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'ToggleTransfers', enabled: false }
        );
        
        expect(disableResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const transfersDisabled = await token.getAreTransfersEnabled();
        expect(transfersDisabled).toBe(false);
        
        // Try to transfer - should fail
        const transferResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'Transfer',
                to: user1.address,
                amount: toNano('100'),
                response_destination: null,
                custom_payload: null,
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );
        
        expect(transferResult.transactions).toHaveTransaction({
            success: false,
        });
        
        // Re-enable transfers
        const enableResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'ToggleTransfers', enabled: true }
        );
        
        expect(enableResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const transfersReEnabled = await token.getAreTransfersEnabled();
        expect(transfersReEnabled).toBe(true);
    });
    
    it('should allow admin to update fee percentage', async () => {
        const newFeePercentage = 50n; // 0.5%
        
        const updateFeeResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'SetFee', feePercentage: newFeePercentage }
        );
        
        expect(updateFeeResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const updatedFeePercentage = await token.getGetFeePercentage();
        expect(updatedFeePercentage).toBe(newFeePercentage);
    });
    
    it('should allow admin to mint new tokens', async () => {
        const mintAmount = toNano('1000');
        const initialTotalSupply = await token.getGetTotalSupply();
        const user1InitialBalance = await token.getBalanceOf(user1.address);
        
        const mintResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Mint', to: user1.address, amount: mintAmount }
        );
        
        expect(mintResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const finalTotalSupply = await token.getGetTotalSupply();
        const user1FinalBalance = await token.getBalanceOf(user1.address);
        
        expect(finalTotalSupply).toEqual(initialTotalSupply + mintAmount);
        expect(user1FinalBalance).toEqual(user1InitialBalance + mintAmount);
    });
    
    it('should allow admin to burn tokens', async () => {
        // First mint some tokens to user1
        const mintAmount = toNano('1000');
        await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Mint', to: user1.address, amount: mintAmount }
        );
        
        const burnAmount = toNano('500');
        const initialTotalSupply = await token.getGetTotalSupply();
        const user1InitialBalance = await token.getBalanceOf(user1.address);
        
        const burnResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Burn', from: user1.address, amount: burnAmount }
        );
        
        expect(burnResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const finalTotalSupply = await token.getGetTotalSupply();
        const user1FinalBalance = await token.getBalanceOf(user1.address);
        
        expect(finalTotalSupply).toEqual(initialTotalSupply - burnAmount);
        expect(user1FinalBalance).toEqual(user1InitialBalance - burnAmount);
    });
    
    it('should allow admin to withdraw accumulated fees', async () => {
        // First create some fees through transfers
        const transferAmount = toNano('1000');
        await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'Transfer',
                to: user1.address,
                amount: transferAmount,
                response_destination: null,
                custom_payload: null,
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );
        
        const accumulatedFees = await token.getGetAccumulatedFees();
        expect(accumulatedFees).toBeGreaterThan(0n);
        
        const withdrawAmount = accumulatedFees;
        const adminInitialBalance = await token.getBalanceOf(deployer.address);
        
        const withdrawResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'WithdrawFees', amount: withdrawAmount }
        );
        
        expect(withdrawResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const finalAccumulatedFees = await token.getGetAccumulatedFees();
        expect(finalAccumulatedFees).toEqual(0n);
    });
    
    it('should allow admin to change admin address', async () => {
        const newAdmin = user1.address;
        
        const changeAdminResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'ChangeAdmin', newAdmin }
        );
        
        expect(changeAdminResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const updatedAdmin = await token.getGetAdmin();
        expect(updatedAdmin.toString()).toEqual(newAdmin.toString());
        
        // Old admin should no longer be able to perform admin actions
        const mintResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Mint', to: user2.address, amount: toNano('100') }
        );
        
        expect(mintResult.transactions).toHaveTransaction({
            success: false,
        });
    });
    
    it('should allow admin to freeze/unfreeze users', async () => {
        // First transfer some tokens to user1
        await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'Transfer',
                to: user1.address,
                amount: toNano('1000'),
                response_destination: null,
                custom_payload: null,
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );
        
        // Freeze user1
        const freezeResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'ToggleFreeze', user: user1.address }
        );
        
        expect(freezeResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const isFrozen = await token.getIsUserFrozen(user1.address);
        expect(isFrozen).toBe(true);
        
        // Try to transfer from frozen user - should fail
        const transferFromFrozenResult = await token.send(
            user1.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'Transfer',
                to: user2.address,
                amount: toNano('100'),
                response_destination: null,
                custom_payload: null,
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );
        
        expect(transferFromFrozenResult.transactions).toHaveTransaction({
            success: false,
        });
        
        // Unfreeze user1
        const unfreezeResult = await token.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'ToggleFreeze', user: user1.address }
        );
        
        expect(unfreezeResult.transactions).toHaveTransaction({
            success: true,
        });
        
        const isUnfrozen = await token.getIsUserFrozen(user1.address);
        expect(isUnfrozen).toBe(false);
    });
    
    it('should prevent non-admin from performing admin actions', async () => {
        // Try to mint as non-admin
        const mintResult = await token.send(
            user1.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Mint', to: user2.address, amount: toNano('100') }
        );
        
        expect(mintResult.transactions).toHaveTransaction({
            success: false,
        });
        
        // Try to set fee as non-admin
        const setFeeResult = await token.send(
            user1.getSender(),
            { value: toNano('0.05') },
            { $$type: 'SetFee', feePercentage: 50n }
        );
        
        expect(setFeeResult.transactions).toHaveTransaction({
            success: false,
        });
    });
});
