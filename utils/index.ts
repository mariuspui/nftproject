import hre, { ethers } from "hardhat";

export const sleep = async (s: number) => {
    for (let i = s; i > 0; i--) {
        process.stdout.write(`\r \\ ${i} waiting..`);
        await new Promise((resolve) => setTimeout(resolve, 250));
        process.stdout.write(`\r | ${i} waiting..`);
        await new Promise((resolve) => setTimeout(resolve, 250));
        process.stdout.write(`\r / ${i} waiting..`);
        await new Promise((resolve) => setTimeout(resolve, 250));
        process.stdout.write(`\r - ${i} waiting..`);
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (i === 1) process.stdout.clearLine(0);
    }
};

export const verify = async (
    contractAddress: string,
    args: (string | number)[] = [],
    name?: string,
    wait: number = 100
) => {
    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
        return true;
    } catch (e) {
        if (
            String(e).indexOf(`${contractAddress} has no bytecode`) !== -1 ||
            String(e).indexOf(`${contractAddress} does not have bytecode`) !== -1
        ) {
            console.log(`Verification failed, waiting ${wait} seconds for etherscan to pick the deployed contract`);
            await sleep(wait);
        }

        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: args,
            });
            return true;
        } catch (e) {
            if (String(e).indexOf("Already Verified") !== -1 || String(e).indexOf("Already verified") !== -1) {
                console.log(name ?? contractAddress, "is already verified!");
                return true;
            } else {
                console.log(e);
                return false;
            }
        }
    }
};

export const deploy = async (name: string, args: (string | number)[] = [], verificationWait = 100) => {
    const contractFactory = await ethers.getContractFactory(name);
    const contract = await contractFactory.deploy(...args);
    await contract.deployed();
    console.log(`${name}: ${contract.address}`);

    if (hre.network.name === "localhost") return contract;

    console.log("Verifying...");
    await verify(contract.address, args, name);

    return contract;
};
