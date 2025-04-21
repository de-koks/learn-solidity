// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract Lottery {
    address public lotteryOrganizer;
    uint public prizeFund;
    uint8 public constant lotteryOrganizersFeePrecentage = 10;
    uint public lotteryOrganizerBalance;

    struct Participant {
        address payable participantAddress;
        uint256 amountSent;
    }

    uint public lotteryRoundsTotal;
    uint public participantsTotal;
    uint public prizeSentTotal;

    Participant[] public participants;

    constructor() {
        lotteryOrganizer = msg.sender;
    }

    receive() external payable {
        //check whether sender is lotteryOrganizer (they cannot participate)
        if(msg.sender == lotteryOrganizer) {
            //if yes - add value to lotteryOrganizerBalance
            lotteryOrganizerBalance += msg.value;        
        } else {
            //if no - add value to prizeFund
            prizeFund += msg.value;

            //and check whether the sender has already been added to participants[]
            bool isParticipantExisrts = false;
            for (uint256 i = 0; i < participants.length; i++) {
                if(participants[i].participantAddress == msg.sender){
                    //if yes - add msg.value to participant's amountSent
                    participants[i].amountSent += msg.value;
                    isParticipantExisrts = true;
                }
            }

            //if no - add a new participant
            if (!isParticipantExisrts) {
                Participant memory newParticipant = Participant(payable (msg.sender), msg.value); // create a new participant with the current value of msg.value and the sender address as its participantAddress
                participants.push(newParticipant);// push it to the participants[] array so that we can keep track of who has entered
            }
        } 
    }

    function launchLottery() public {
        require(msg.sender == lotteryOrganizer, "Only the lottery organizer can launch the lottery.");
        require(participants.length > 2, "Lottery must have at least 3 participants");

        //pick a random one among participants[]
        uint256 indexOfRandomParticipant = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % participants.length;
        Participant storage winner = participants[indexOfRandomParticipant];  //select a random participant from the participants[] array
        
        //charge prizeFund with lotteryOrganizersFee
        uint lotteryOrganizerFee = prizeFund * (100 - lotteryOrganizersFeePrecentage);
        prizeFund -= lotteryOrganizerFee;
        lotteryOrganizerBalance += lotteryOrganizerFee;

        //send prize to the winner
        winner.participantAddress.transfer(prizeFund);// transfer the current value of prizeFund to the address stored in lotteryOrganizer's account

        //record the total logs
        lotteryRoundsTotal++; 
        participantsTotal += participants.length;
        prizeSentTotal += prizeFund;

        //clear participants array
        delete participants;
        //now we can conduct another issue of the lottery
    }

    function withdrawLotteryOrganizerFee(uint amount, address payable destination) external {
        require(msg.sender == lotteryOrganizer, "Only the lottery organizer can withdraw.");
        require(lotteryOrganizerBalance >= amount, "Insufficient lottery orginizer fee fund");

        //send lotteryOrganizerFee to the specified destination
        destination.transfer(amount);
    }
}