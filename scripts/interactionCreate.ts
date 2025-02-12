import { ethers } from "hardhat";
require("dotenv").config();

const {CONTRACT_ADDRESS} = process.env;

async function create() {
     if (!CONTRACT_ADDRESS) {
          throw new Error("CONTRACT_ADDRESS is not defined in the environment variables.");
      }
     console.log(CONTRACT_ADDRESS);
     const block = await ethers.provider.getBlock('latest');
     const latestTime= block.timestamp;
     const eventContract = await ethers.getContractAt("EventContract", CONTRACT_ADDRESS);

     // const latestTime = await time.latest();
     const tx = await eventContract.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0)
     await tx.wait();

     console.log(tx, "Event created successfully!");
}

create()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });