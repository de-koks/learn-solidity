// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract Lottery {
    address public lotteryOrganizer;
    uint256 public prizeFund;
    uint256 public lotteryOrganizerFee;

    struct Participant {
        address participantAddress;
        uint256 amountSent;
    }

    Participant[] public participants;

    constructor() {
        lotteryOrganizer = msg.sender;
    }

    receive() external payable {
        //check whether sender is lotteryOrganizer (they cannot participate)
        if(msg.sender == lotteryOrganizer) {
            //if yes - add value to lotteryOrganizerFee
            lotteryOrganizerFee += msg.value;        
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
                Participant memory newParticipant = Participant(msg.sender, msg.value); // create a new participant with the current value of msg.value and the sender address as its participantAddress
                participants.push(newParticipant);// push it to the participants[] array so that we can keep track of who has entered
            }
        } 
    }
}