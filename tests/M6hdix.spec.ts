import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { M6hdix } from '../build/M6hdix/M6hdix_M6hdix';
import '@ton/test-utils';

describe('M6hdix', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let m6hdix: SandboxContract<M6hdix>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        m6hdix = blockchain.openContract(await M6hdix.fromInit(0n, 0n));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await m6hdix.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: m6hdix.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and m6hdix are ready to use
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            console.log(`increase ${i + 1}/${increaseTimes}`);

            const increaser = await blockchain.treasury('increaser' + i);

            const counterBefore = await m6hdix.getCounter();

            console.log('counter before increasing', counterBefore);

            const increaseBy = BigInt(Math.floor(Math.random() * 100));

            console.log('increasing by', increaseBy);

            const increaseResult = await m6hdix.send(
                increaser.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'Add',
                    amount: increaseBy,
                }
            );

            expect(increaseResult.transactions).toHaveTransaction({
                from: increaser.address,
                to: m6hdix.address,
                success: true,
            });

            const counterAfter = await m6hdix.getCounter();

            console.log('counter after increasing', counterAfter);

            expect(counterAfter).toBe(counterBefore + increaseBy);
        }
    });
});
