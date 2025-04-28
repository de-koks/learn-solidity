const { expect } = require("chai");
const hre = require("hardhat");

async function verifyLaunchLottery(lottery, participants) {
    // Save the round properties before the lottery is launched
    const numberOfParticipants = participants.length;
    const prizeFund = await lottery.prizeFund();
    const lotteryRoundsBefore = await lottery.lotteryRoundsTotal();
    const participantsBefore = await lottery.participantsTotal();
    const prizeSentBefore = await lottery.prizeSentTotal();

    // Create an instance of provider to retrieve balances
    const provider = hre.ethers.provider;

    // Save the balances of the participant wallets before the lottery is launched
    const participantWallets = [];
    for (let i = 0; i < participants.length; i++) {
        
        // Need to save the participant to address it as an object 
        const currentParticipant = await lottery.participants(i);
        const currentAddress = currentParticipant.participantAddress; // Get the participant's address
        participantWallets.push(await provider.getBalance(currentAddress)); // Use provider to get balance
    }

    // Launch the lottery
    await lottery.launchLottery();

    // Verify that one of the participants got their balance increased by the prizeFund value
    let winnerFound = false;
    for (let i = 0; i < participants.length; i++) {
        // Get the participant's address
        const participantAddress = participants[i].address;

        // Get the new balance of the participant
        const newBalance = await provider.getBalance(participantAddress);

        if (newBalance > participantWallets[i]) {
            // If winner was found, check that their balance increased exactly by the prizeFund value
            expect(newBalance - participantWallets[i]).to.equal(prizeFund);
            winnerFound = true;
            break;
        }
    }

    // Check that the winner was found
    expect(winnerFound).to.be.true;

    // Check that prizeFund is reset to 0
    expect(await lottery.prizeFund()).to.equal(0);

    // Check that participants array is reset
    expect(await lottery.participants.length).to.equal(0);

    // Check that logs were recorded
    const lotteryRoundsAfter = await lottery.lotteryRoundsTotal();
    const participantsAfter = await lottery.participantsTotal();
    const prizeSentAfter = await lottery.prizeSentTotal();
    expect(lotteryRoundsAfter).to.equal(lotteryRoundsBefore + BigInt(1));
    expect(participantsAfter).to.equal(participantsBefore + BigInt(numberOfParticipants));
    expect(prizeSentAfter).to.equal(prizeSentBefore + prizeFund);
}

module.exports = { verifyLaunchLottery };