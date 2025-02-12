import { ethers } from "hardhat";
require("dotenv").config();

const {CONTRACT_ADDRESS} = process.env;

async function register() {
     if (!CONTRACT_ADDRESS) {
          throw new Error("CONTRACT_ADDRESS is not defined in the environment variables.");
      }
     console.log(CONTRACT_ADDRESS);
     const eventContract = await ethers.getContractAt("EventContract", CONTRACT_ADDRESS);
     const user = await ethers.provider.getSigner()

     // const latestTime = await time.latest();
     const tx = await eventContract.registerForEvent(1, {value: 20});
     await tx.wait();

     console.log(tx, "you have registered");
}

register()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });