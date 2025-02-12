import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assert } from "console";
import hre from "hardhat";
import { expect } from "chai";

describe('Event test', () => {
    
    const deployEventContract = async  () => {

        const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

        const [owner, account1, account2, account3] = await hre.ethers.getSigners();

        const event = await hre.ethers.getContractFactory("EventContract");

        const deployEvent = await event.deploy();

        return {deployEvent, owner, account1, account2, account3, ADDRESS_ZERO}
    }

    describe("Deployment", () => {

        it('should be deployed by owner', async() => {
            let {deployEvent, owner} = await loadFixture(deployEventContract);

            const runner = deployEvent.runner as HardhatEthersSigner;

            expect(runner.address).to.equal(owner.address);
        })

        it('should not be address zero', async() => {
            let {deployEvent, ADDRESS_ZERO} = await loadFixture(deployEventContract);

            expect(deployEvent.target).to.not.be.equal(ADDRESS_ZERO);
        }) 
    })

    describe('Create Event', () => {

        it('should create an event', async () => {

            const latestTime = await time.latest();

            let {deployEvent} = await loadFixture(deployEventContract);

            let eventCountBeforeDeployment = await deployEvent.event_count();

            let e = await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);

            let eventCountAfterDeployment = await deployEvent.event_count();

            expect(eventCountAfterDeployment).to.be.greaterThan(eventCountBeforeDeployment);
        });

        it('should not allow event creation with a past date', async () => {
            const latestTime = await time.latest();
            let { deployEvent } = await loadFixture(deployEventContract);
            await expect(deployEvent.createEvent('poolparty', 'come with your baddie', latestTime - 100, latestTime + 86400, 0, 20, 0)).to.be.revertedWith("Future dates only");
        });
        
        it('should not allow creation of event with end date lesser than start date', async () => {
            const latestTime = await time.latest();
            let { deployEvent } = await loadFixture(deployEventContract);
            await expect(deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 200, latestTime + 100, 0, 20, 0)).to.be.revertedWith("End date must greater than start date");
        });

        it('should increment event count after creating an event', async () => {
            const latestTime = await time.latest();
            let { deployEvent } = await loadFixture(deployEventContract);
            const initialEventCount = await deployEvent.event_count();
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
            const newEventCount = await deployEvent.event_count();
            expect(newEventCount).to.greaterThan(initialEventCount);
        });
    });

    describe('Register for Event', () => {
        it('should allow a user to register for a free event', async () => {
            const latestTime = await time.latest();
            let {deployEvent, account1} = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
            await deployEvent.connect(account1).registerForEvent(1, {value: 0});
            expect(await deployEvent.checkHasRegistered(account1.address, 1)).to.be.true;
        });

        it('should allow a user to register for a paid event', async () => {
            const latestTime = await time.latest();
            let {deployEvent, account1} = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 1, 20, 20);
            await deployEvent.connect(account1).registerForEvent(1, {value: 20});
            expect(await deployEvent.checkHasRegistered(account1.address, 1)).to.be.true;
        });

        it('should not allow registration after the event has ended', async () => {
            const latestTime = await time.latest();
            let { deployEvent, account1 } = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 100, 1, 20, 200);
            await time.increase(200);
            await expect(deployEvent.connect(account1).registerForEvent(1, { value: 0 })).to.be.revertedWith("EVENT ENDED");
        });

        it('should not allow attendee register event twice', async () => {
            const latestTime = await time.latest();
            let { deployEvent, account1 } = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 1, 20, 200);
            await deployEvent.connect(account1).registerForEvent(1, { value: 200 });
            await expect(deployEvent.connect(account1).registerForEvent(1, { value: 200 })).to.be.revertedWith("ALREADY REGISTERED");
        });

        it('should not allow incorrect payment', async () => {
            const latestTime = await time.latest();
            let { deployEvent, account1 } = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 1, 20, 200);
            await expect(deployEvent.connect(account1).registerForEvent(1, { value: 20 })).to.be.revertedWith("INCORRECT PAYMENT");
        });

        // it('should not allow payment for a free event', async () => {
        //     const latestTime = await time.latest();
        //     let { deployEvent, account1 } = await loadFixture(deployEventContract);
        //     await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
        //     await expect(deployEvent.connect(account1).registerForEvent(1, { value: 10 })).to.be.reverted;
        // });

        it('should not allow registration beyond event capacity', async () => {
            const latestTime = await time.latest();
            let { deployEvent, account1, account2, account3 } = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 2, 0);
            await deployEvent.connect(account1).registerForEvent(1, { value: 0 });
            await deployEvent.connect(account2).registerForEvent(1, { value: 0 });
            await expect(deployEvent.connect(account3).registerForEvent(1, { value: 0 })).to.be.revertedWith("REGISTRATION CLOSED");
        });

    });

    describe('Create Event Ticket', () => {
        it('should allow organizer to create a ticket', async () => {
            const latestTime = await time.latest();
            let {deployEvent, account1} = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
            await expect(deployEvent.connect(account1).createEventTicket(1, 'PoolPass', 'PPASS')).to.be.revertedWith("ONLY ORGANIZER ALLOWED");
        });

        it('should not allow creating multiple ticket for an event', async () => {
            const latestTime = await time.latest();
            let { deployEvent } = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
            await deployEvent.createEventTicket(1, 'PoolPass', 'PPASS');
            await expect(deployEvent.createEventTicket(1, 'PoolPass2', 'PPASS2')).to.be.revertedWith("TICKET ALREADY CREATED");
        });
    });

    describe('Verify Attendance', () => {
        it('should allow organizer to verify attendee', async () => {
            const latestTime = await time.latest();
            let {deployEvent, owner, account1} = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
            await deployEvent.connect(account1).registerForEvent(1, {value: 0});
            await deployEvent.verifyAttendance(1, account1.address);
            expect(await deployEvent.checkHasVerified(1, account1.address)).to.be.true;
        });

        it('should not allow multpile verification of attendee', async () => {
            const latestTime = await time.latest();
            let { deployEvent, account1 } = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
            await deployEvent.connect(account1).registerForEvent(1, { value: 0 });
            await deployEvent.verifyAttendance(1, account1.address);
            await expect(deployEvent.verifyAttendance(1, account1.address)).to.be.revertedWith("ALREADY VERIFIED");
        });

        it('should not allow non-organizer to verify attendance', async () => {
            const latestTime = await time.latest();
            let { deployEvent, account1, account2 } = await loadFixture(deployEventContract);
            await deployEvent.createEvent('poolparty', 'come with your baddie', latestTime + 90, latestTime + 86400, 0, 20, 0);
            await deployEvent.connect(account1).registerForEvent(1, { value: 0 });
            await expect(deployEvent.connect(account2).verifyAttendance(1, account1.address)).to.be.revertedWith("ONLY ORGANIZER ALLOWED");
        });
        
    });
});
