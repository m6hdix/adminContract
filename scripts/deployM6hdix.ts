import { toNano } from '@ton/core';
import { MahdiToken } from '../build/MahdiToken/MahdiToken_MahdiToken';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const token = provider.open(await MahdiToken.fromInit());

    await token.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(token.address);

    console.log('MahdiToken deployed at:', token.address.toString());
    console.log('Contract owner:', provider.sender().address?.toString());
    console.log('Total supply:', (await token.getGetTotalSupply()).toString());
    console.log('Token metadata:', await token.getGetMetadata());
}
