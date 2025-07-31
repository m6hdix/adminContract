import { toNano } from '@ton/core';
import { M6hdix } from '../build/M6hdix/M6hdix_M6hdix';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const m6hdix = provider.open(await M6hdix.fromInit(BigInt(Math.floor(Math.random() * 10000)), 0n));

    await m6hdix.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(m6hdix.address);

    console.log('ID', await m6hdix.getId());
}
