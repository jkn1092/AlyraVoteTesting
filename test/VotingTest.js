const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Voting", accounts => {

    const admin = accounts[0];
    const voters = {
        0 : accounts[1],
        1 : accounts[2],
        2 : accounts[3],
        3 : accounts[4],
        4 : accounts[5],
    };

    let votingInstance;

    /**
     * Main Testing
     * Going through different cases possible with expect, expectEvent and expectRevert with the main instance
     * The code will pick the Proposal ID 3
     */
    describe('Main Testing', function () {

        before('create an instance of the contract', async function () {
            votingInstance = await Voting.new({from: admin});
        })

        /**
         * Testing RegisteringVoters Workflow
         * Steps:
         * - check correct state is 0
         * - check revert by registering from voter address
         * - register voters
         * - check emit event VoterRegistered
         * - check voters isRegistered is true
         * - check revert by registering a registered voter
         * - check revert by ending registration proposal session
         * - check revert by starting vote session
         * - check revert by ending vote session
         * - check revert by tally votes
         */
        describe('RegisteringVoters Workflow', function () {

            it('workflowStatus should be at 0 = RegisteringVoters', async function () {
                const status = await votingInstance.workflowStatus.call();
                expect(status).to.be.bignumber.equal(new BN(0));
            });

            it('should revert with not authorized', async function () {
                await expectRevert(votingInstance.addVoter(voters[0], {from: voters[0]}),
                    "Ownable: caller is not the owner.");
            });

            it('should emit events VoterRegistered', async function () {
                for (const voterAddress of Object.values(voters) ) {
                    let result = await votingInstance.addVoter(voterAddress, {from: admin});
                    await expectEvent(result, 'VoterRegistered',{ voterAddress: voterAddress });
                }
            });

            it('should get isRegistered to true', async function () {
                for (const voterAddress of Object.values(voters) ) {
                    let voter = await votingInstance.getVoter(voterAddress, {from: voterAddress});
                    await expect(voter.isRegistered).to.be.equal(true);
                }
            });

            it('should revert with already registered', async function () {
                await expectRevert(votingInstance.addVoter(voters[0], {from: admin}),
                    "Already registered");
            });

            it('should revert with registering proposals not started', async function () {
                await expectRevert(votingInstance.endProposalsRegistering({from: admin}),
                    "Registering proposals havent started yet");
            });

            it('should revert with registering proposals not finished', async function () {
                await expectRevert(votingInstance.startVotingSession({from: admin}),
                    "Registering proposals phase is not finished");
            });

            it('should revert with voting session not started', async function () {
                await expectRevert(votingInstance.endVotingSession({from: admin}),
                    "Voting session havent started yet");
            });

            it('should revert with voting session not ended', async function () {
                await expectRevert(votingInstance.tallyVotes({from: admin}),
                    "Current status is not voting session ended");
            });

        });

        /**
         * Testing ProposalsRegistration Workflow
         * Steps:
         * - check revert by adding proposal when registration not started
         * - update state to ProposalsRegistrationStarted
         * - check emit event WorkflowStatusChange
         * - check workflowStatus is equal to 1
         * - check default proposalId '0' description is 'GENESIS'
         * - check revert by adding proposal as admin
         * - check revert by adding empty proposal
         * - add proposal 'First'
         * - check emit event ProposalRegistered
         * - check proposalId '1' description is 'First'
         * - add proposal 'Second'
         * - check emit event ProposalRegistered
         * - check proposalId '2' description is 'Second'
         * - add proposal 'Third'
         * - check emit event ProposalRegistered
         * - check proposalId '3' description is 'Third'
         * - update state to ProposalsRegistrationEnded
         * - check emit event WorkflowStatusChange
         * - check workflowStatus is equal to 2
         */
        describe('ProposalsRegistration Workflow', function() {

            it('should revert with not allowed', async function () {
                await expectRevert(votingInstance.addProposal("First one", {from: voters[0]}),
                    "Proposals are not allowed yet");
            });

            it('should emit event WorkflowStatusChange ProposalsRegistrationStarted', async function () {
                const result = await votingInstance.startProposalsRegistering({from: admin});
                expectEvent(result, 'WorkflowStatusChange',
                    { previousStatus: new BN(0), newStatus: new BN(1) });
            });

            it('workflowStatus should be at 1 = ProposalsRegistrationStarted', async function() {
                const status = await votingInstance.workflowStatus.call();
                expect(status).to.be.bignumber.equal(new BN(1));
            });

            it('should have proposal by default', async function () {
                let proposal = await votingInstance.getOneProposal(0, {from: voters[0]});
                expect(proposal.description).to.be.equal("GENESIS");
            });

            it('should revert with not a voter', async function () {
                await expectRevert(votingInstance.addProposal("Test", {from: admin}),
                    "You're not a voter");
            });

            it('should revert', async function () {
                await expectRevert(votingInstance.addProposal("", {from: voters[0]}),
                    "Vous ne pouvez pas ne rien proposer");
            });

            it('should emit event ProposalRegistered for First', async function () {
                const result = await votingInstance.addProposal("First", {from: voters[0]});
                expectEvent(result, 'ProposalRegistered',{ proposalId: new BN(1) });
            });

            it('should be created with description First', async function () {
                let proposal = await votingInstance.getOneProposal(1, {from: voters[0]});
                expect(proposal.description).to.be.equal("First");
            });

            it('should emit event ProposalRegistered for Second', async function () {
                const result = await votingInstance.addProposal("Second", {from: voters[0]});
                expectEvent(result, 'ProposalRegistered',{ proposalId: new BN(2) });
            });

            it('should be created with description Second', async function () {
                let proposal = await votingInstance.getOneProposal(2, {from: voters[0]});
                expect(proposal.description).to.be.equal("Second");
            });

            it('should emit event ProposalRegistered for Third', async function () {
                const result = await votingInstance.addProposal("Third", {from: voters[1]});
                expectEvent(result, 'ProposalRegistered',{ proposalId: new BN(3) });
            });

            it('should be created with description Third', async function () {
                let proposal = await votingInstance.getOneProposal(3, {from: voters[0]});
                expect(proposal.description).to.be.equal("Third");
            });

            it('should emit event WorkflowStatusChange ProposalsRegistrationEnded', async function () {
                const result = await votingInstance.endProposalsRegistering({from: admin});
                expectEvent(result, 'WorkflowStatusChange',
                    { previousStatus: new BN(1), newStatus: new BN(2) });
            });

            it('workflowStatus should be at 2 = ProposalsRegistrationEnded', async function() {
                const status = await votingInstance.workflowStatus.call();
                expect(status).to.be.bignumber.equal(new BN(2));
            });

        });

        /**
         * Testing VotingSession Workflow
         * Steps:
         * - check revert by adding vote when voting not started
         * - update state to VotingSessionStarted
         * - check emit event WorkflowStatusChange
         * - check workflowStatus is equal to 3
         * - check revert by voting as admin
         * - check revert by voting for non-existing proposal
         * - add vote proposalId '1' from voters[0]
         * - check emit event Voted
         * - check voters[0] hasVoted is true
         * - check voters[0] votedProposalId is 1
         * - check revert by voting again with voters[0]
         * - add vote proposalId '3' from voters besides voters[0]
         * - check emit event Voted
         * - check voters besides voters[0] hasVoted is true
         * - check voters besides voters[0] votedProposalId is 3
         * - update state to VotingSessionEnded
         * - check emit event WorkflowStatusChange
         * - check workflowStatus is equal to 4
         */
        describe('VotingSession Workflow', function() {

            it('should revert with voting session havent started', async function () {
                await expectRevert(votingInstance.setVote(1, {from: voters[0]}),
                    "Voting session havent started yet");
            });

            it('should emit event WorkflowStatusChange VotingSessionStarted', async function () {
                const result = await votingInstance.startVotingSession({from: admin});
                expectEvent(result, 'WorkflowStatusChange',
                    { previousStatus: new BN(2), newStatus: new BN(3) });
            });

            it('workflowStatus should be at 3 = VotingSessionStarted', async function() {
                const status = await votingInstance.workflowStatus.call();
                expect(status).to.be.bignumber.equal(new BN(3));
            });

            it('should revert with not a voter', async function () {
                await expectRevert(votingInstance.setVote(1, {from: admin}),
                    "You're not a voter");
            });

            it('should revert with not found', async function () {
                await expectRevert(votingInstance.setVote(100, {from: voters[0]}),
                    "Proposal not found");
            });

            it('should emit event Voted for voters[0]', async function () {
                const result = await votingInstance.setVote(1, {from: voters[0]});
                expectEvent(result, 'Voted',
                    { voter: voters[0], proposalId: new BN(1) });
            });

            it('should set voters[0] hasVoted = true and votedProposalId = 1', async function () {
                let voter = await votingInstance.getVoter(voters[0], {from: voters[0]});
                expect(voter.hasVoted).to.be.equal(true);
                expect(voter.votedProposalId).to.be.bignumber.equal(new BN(1));
            });

            it('should revert with already voted', async function () {
                await expectRevert(votingInstance.setVote(2, {from: voters[0]}),
                    "You have already voted");
            });

            it('should emit events Voted voters', async function() {
                for (const voterAddress of Object.values(voters).slice(1)) {
                    const result = await votingInstance.setVote(3, {from: voterAddress});
                    expectEvent(result, 'Voted',
                        { voter: voterAddress, proposalId: new BN(3) });
                }
            });

            it('should set voters hasVoted = true and votedProposalId = 3', async function () {
                for (const voterAddress of Object.values(voters).slice(1)) {
                    let voter = await votingInstance.getVoter(voterAddress, {from: voters[0]});
                    expect(voter.hasVoted).to.be.equal(true);
                    expect(voter.votedProposalId).to.be.bignumber.equal(new BN(3));
                }
            });

            it('should emit event WorkflowStatusChange VotingSessionEnded', async function () {
                const result = await votingInstance.endVotingSession({from: admin});
                expectEvent(result, 'WorkflowStatusChange',
                    { previousStatus: new BN(3), newStatus: new BN(4) });
            });

            it('workflowStatus should be at 4 = VotingSessionEnded', async function() {
                const status = await votingInstance.workflowStatus.call();
                expect(status).to.be.bignumber.equal(new BN(4));
            });

        });

        /**
         * Testing VotesTallied Workflow
         * Steps:
         * - check revert by tally votes from voter address
         * - tally votes
         * - check emit event WorkflowStatusChange
         * - check workflowStatus is equal to 5
         * - check winningProposalID is 3
         */
        describe('VotesTallied', function() {

            it('should revert with not allowed', async function () {
                await expectRevert(votingInstance.tallyVotes({from: voters[0]}),"Ownable: caller is not the owner.");
            });

            it('should tally votes and emit event WorkflowStatusChange VotesTallied', async function () {
                const result = await votingInstance.tallyVotes({from: admin});
                expectEvent(result, 'WorkflowStatusChange',
                    { previousStatus: new BN(4), newStatus: new BN(5) });
            });

            it('workflowStatus should be at 5 = VotesTallied', async function() {
                const status = await votingInstance.workflowStatus.call();
                expect(status).to.be.bignumber.equal(new BN(5));
            });

            it('should have winnerProposalID = 3', async function () {
                const winningProposalID = await votingInstance.winningProposalID.call();
                expect(winningProposalID).to.be.bignumber.equal(new BN(3));
            });

        });

    });

    /**
     * Testing case if there is no proposal no vote
     * The code will pick the default proposal 'GENESIS'.
     */
    describe('No Proposal No Vote Scenario', function () {

        before('create an instance of the contract', async function () {
            votingInstance = await Voting.new({from: admin});
        })

        it('should pick default proposal GENESIS', async function () {
            await votingInstance.startProposalsRegistering({from: admin});
            await votingInstance.endProposalsRegistering({from: admin});
            await votingInstance.startVotingSession({from: admin});
            await votingInstance.endVotingSession({from: admin});
            await votingInstance.tallyVotes({from: admin});

            const winningProposalID = await votingInstance.winningProposalID.call();
            expect(winningProposalID).to.be.bignumber.equal(new BN(0));
        });
    });

    /**
     * Testing case if there is 2 proposals with same number of votes
     * The code will pick the first proposal with the most vote.
     */
    describe('Draw Scenario', function () {

        before('create an instance of the contract', async function () {
            votingInstance = await Voting.new({from: admin});
        })

        it('should pick first proposal', async function() {
            for (const voterAddress of Object.values(voters) ) {
                await votingInstance.addVoter(voterAddress, {from: admin});
            }

            await votingInstance.startProposalsRegistering({from: admin});
            await votingInstance.addProposal("First", {from: voters[0]});
            await votingInstance.addProposal("Second", {from: voters[0]});
            await votingInstance.addProposal("Third", {from: voters[1]});
            await votingInstance.endProposalsRegistering({from: admin});

            await votingInstance.startVotingSession({from: admin});
            await votingInstance.setVote(1, {from: voters[0]});
            await votingInstance.setVote(1, {from: voters[1]});
            await votingInstance.setVote(2, {from: voters[2]});
            await votingInstance.setVote(3, {from: voters[3]});
            await votingInstance.setVote(3, {from: voters[4]});
            await votingInstance.endVotingSession({from: admin});

            await votingInstance.tallyVotes({from: admin});
            const winningProposalID = await votingInstance.winningProposalID.call();
            expect(winningProposalID).to.be.bignumber.equal(new BN(1));
        });
    });

});