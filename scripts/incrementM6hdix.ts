import { Address, toNano } from '@ton/core';
import { M6hdix } from '../build/M6hdix/M6hdix_M6hdix';
import { NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('M6hdix address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const m6hdix = provider.open(M6hdix.fromAddress(address));

    const counterBefore = await m6hdix.getCounter();

    await m6hdix.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Add',
            amount: 1n,
        }
    );

    ui.write('Waiting for counter to increase...');

    let counterAfter = await m6hdix.getCounter();
    let attempt = 1;
    while (counterAfter === counterBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        counterAfter = await m6hdix.getCounter();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Counter increased successfully!');
}
