import { SubstrateBlock } from "@subql/types";
import { ChronicleKey } from "../constants";
import { upsert } from "../services/storage";
import { Crowdloan } from '../types/models/Crowdloan';
import { Chronicle } from '../types/models/Chronicle';
import { Parachain } from "../types/models/Parachain";
import { Bid } from "../types/models/Bid";
import { orderBy, take } from "lodash";
import * as Storage from '../services/storage';
import { Incentive } from "../types/models/Incentive";
import { Auction } from "../types/models/Auction";
import { calculateHdxMultiplier } from "./incentives/calculateHdxMultiplier";
import BigNumber from "bignumber.js";
import { calculateBsxMultiplier } from "./incentives/calculateBsxMultiplier";

// for testing purposes only
const karuraParaId = "2000-Gq2No2gcF6s4DLfzzuB53G5opWCoCtK9tZeVGRGcmkSDGoK"
const moonriverParaId = "2023-FFuCbRwsDTkj1cc2w6dvBmXvumyoZR6QgfAv1LwL3kBgmbX"
// const basiliskParaId = ""

// configuration
const aggregationDuration = 50;
// TODO: replace with BSX parachain ID
const ownParachainId = moonriverParaId
// TODO: replace with 4
const targetAuctionId = "2" // it's a string in the DB, don't ask why

/**
 * Every `aggregationDuration` blocks (e.g. 50) save the balance/raised of every crowdloan.
 * @param block 
 */
export const aggregateCrowdloanBalances = async (block: SubstrateBlock) => {
    //logger.info(`Aggregating fund balances`);
    const blockNum = block.block.header.number.toNumber();
    const chronicle = await Chronicle.get(ChronicleKey);
    const blocksSinceLastAggregation = blockNum - (chronicle.lastAggregatedBalanceBlockNum || 0);

    //logger.info(`Blocks since last aggregation: ${blocksSinceLastAggregation}`)
    if (blocksSinceLastAggregation >= aggregationDuration) {
        //logger.info(`Aggregating fund balances for block ${blockNum}`);
        // save the current aggregation blockNum to the chronicle
        chronicle.lastAggregatedBalanceBlockNum = blockNum;
        await chronicle.save();

        /**
         * isFinished = true, only if the crowdloan has been dissolved,
         * which is a long time from now
         */
        const funds = (await Crowdloan.getByIsFinished(false) || [])
        
        // for every fund, save the latest balance/raised
        for (const fund of funds) {
            const { raised, parachainId } = fund;
            const fundId = fund.id;

            //logger.info(`Aggregating fund balances for parachainId: ${parachainId}`);

            const aggregatedCrowdloanBalanceId = `${fundId}-${blockNum}`
            await upsert('AggregatedCrowdloanBalance', aggregatedCrowdloanBalanceId, {
                id: aggregatedCrowdloanBalanceId,
                raised: raised,
                fundId,
                parachainId,
                blockNum,
            })
        }
    }
}

/**
 * Every `aggregationDuration` blocks (e.g. 50) save the bids of every parachain
 * @param block 
 */
export const aggregateAuctionBids = async (block: SubstrateBlock) => {
    //logger.info(`Aggregating parachain bids`);
    const blockNum = block.block.header.number.toNumber();
    const chronicle = await Chronicle.get(ChronicleKey);
    const blocksSinceLastAggregation = blockNum - (chronicle.lastAggregatedBidsBlockNum || 0);

    //logger.info(`Blocks since last aggregation: ${blocksSinceLastAggregation}`)
    if (blocksSinceLastAggregation >= aggregationDuration) {
        //logger.info(`Aggregating parachain bids for block ${blockNum}`);
        
        // save the current aggregation blockNum to the chronicle
        chronicle.lastAggregatedBidsBlockNum = blockNum;
        await chronicle.save();

        const parachains = (await Parachain.getByDeregistered(false) || [])
        
        // for every parachain, save the latest/highest bid
        for (const parachain of parachains) {
            const parachainId = parachain.id;
            const fundId = await Storage.getLatestCrowdloanId(parachainId)
            
            //logger.info(`Aggregating parachain bids for parachainId: ${parachainId}`);

            const bids = (await Bid.getByParachainId(parachainId) || [])
            const sortedBids = orderBy(bids, ['amount'], ['desc']);
            const highestBid = sortedBids[0]

            if (highestBid && highestBid.amount) {
                const highestBidAmount = highestBid.amount;
                const aggregatedParachainBidId = `${parachainId}-${blockNum}`

                await upsert('AggregatedParachainBid', aggregatedParachainBidId, {
                    id: aggregatedParachainBidId,
                    amount: highestBidAmount,
                    parachainId,
                    fundId,
                    blockNum,
                })
            } 
            
        }
    }
}

/**
 * Find the top two crowdloans in terms of money raised.
 * Depending on the auction timeline/status relative to the targetAuctionId,
 * either the first or the second richest crowdloan is used down the line.
 */
const getSiblingCrowdloanCandidates = async () => {
    // 'Started' means it did not win an auction yet, or was not dissolved (long future outlook anyways)
    const crowdloans = (await Crowdloan.getByStatus("Started")) || [];
    const notOwnCrowdloans = crowdloans.filter(crowdloan => crowdloan.parachainId != ownParachainId)
    const richCrowdloans = take(
        orderBy(notOwnCrowdloans, ['raised'], ['desc']),
        2
    );

    return richCrowdloans;
}

// same logic as for sibling crowdloan candidates
const getSiblingBidCandidatesByAuctionId = async (auctionId) => {
    const bids = (await Bid.getByAuctionId(`${auctionId}`)) || [];
    const notOwnBids = bids.filter(bid => bid.parachainId != ownParachainId);
    const highestBids = take(
        orderBy(notOwnBids, ['amount'], ['desc']),
        2
    )

    return highestBids;
}

const upsertIncentive = async (incentive) => {
    const incentiveId = incentive.blockNum;
    await upsert('Incentive', incentiveId, {
        id: incentiveId,
        ...incentive
    })
}

const calculateIncentives = (
    blockNum, 
    siblingCrowdloanCandidates, 
    siblingBidCandidates,
    ownCrowdloanRaised,
    ownCrowdloanStartBlockNum,
    currentAuction,
    isSignificant
) => async (
    // first or second crowdloan/bid candidate
    candidateOffset,
) => {
    const siblingCrowdloanCandidate = siblingCrowdloanCandidates[candidateOffset]; // second largest crowdloan
    const siblingCrowdloanCandidateRaised = (siblingCrowdloanCandidate && siblingCrowdloanCandidate.raised) || 0;
    const siblingCrowdloanCandidateParachainId = (siblingCrowdloanCandidate && siblingCrowdloanCandidate.parachainId);

    const siblingBidCandidate = siblingBidCandidates[candidateOffset]
    const siblingBidCandidateAmount = (siblingBidCandidate && siblingBidCandidates.amount) || 0  // second largest bid
    const siblingBidCandidateParachainId = (siblingBidCandidate && siblingBidCandidate.parachainId);
    
    // Since the bid amount takes precedence due to being larger, use the bid's parachainId instead
    const siblingParachainId = siblingBidCandidateAmount > siblingCrowdloanCandidateRaised ? siblingBidCandidateParachainId : siblingCrowdloanCandidateParachainId;
    // if the manually placed bid for the parachain is higher than the crowdloan, use it for 'imidiate valuation'
    // this helps handle the case where a manual bid with a large amount of private funds is used to skew the auction progress
    const imidiateSiblingParachainValuation = siblingBidCandidateAmount > siblingCrowdloanCandidateRaised ? siblingBidCandidateAmount : siblingCrowdloanCandidateRaised;

    const auctionClosingStart = ((currentAuction && currentAuction.closingStart) || 0)
    const auctionClosingEnd = ((currentAuction && currentAuction.closingEnd) || 0)
    const isRightBeforeTargetAuction = parseInt(currentAuction.id) < (parseInt(targetAuctionId) - 1)

    // hdxMultiplier a.k.a. hdxBonus
    const hdxMultiplier = calculateHdxMultiplier(
        new BigNumber(imidiateSiblingParachainValuation),
        new BigNumber(ownCrowdloanRaised)
    );
    
    const bsxMultiplier = calculateBsxMultiplier(
        blockNum,
        isRightBeforeTargetAuction,
        auctionClosingStart,
        auctionClosingEnd
    );
    
    logger.info(`Upserting incentives for blockNum ${blockNum}, bsx: ${bsxMultiplier}, hdx: ${hdxMultiplier}, siblingParachainId: ${siblingParachainId}`)
    await upsertIncentive({
        blockNum,
        siblingParachainId,
        bsxMultiplier: bsxMultiplier,
        hdxBonus: hdxMultiplier,
        significant: isSignificant
    })
}

/**
 * If we're not in the target auctionId, find the second highest bid from 
 * the current auction - assuming there is one. This condition will be satisfied since we're
 * realistically not targeting the first auctioned slot.
 * 
 * Next step is to compare the bid's underlying crowdloan (found via the connecting parachainId),
 * with the bid size itself. If the bid is larger than the crowdloan's raised amount, then we use
 * the bid's amount to represent the `imidiateParachainValuation`. Otherwise we fallback to the 
 * crowdloan raised amount.
 * 
 * Our ownImidiateParachainValuation is always determined by our crowdloan's raised amount,
 * since we do not plan to place bids outside of the protocol crowdloan bidding mechanism itself.dnes n
 * @param block
 */
export const determineIncentives = async (block: SubstrateBlock) => {
    logger.info('Determining incentives')
    const blockNum = block.block.header.number.toNumber();
    const chronicle = await Chronicle.get(ChronicleKey);
    const blocksSinceLastSignificantIncentive = blockNum - (chronicle.lastSignificantIncentive || 0);
    const isSignificant = blocksSinceLastSignificantIncentive > aggregationDuration;

    const ownCrowdloans = (await Crowdloan.getByParachainId(ownParachainId)) || [];
    const ownCrowdloan = ownCrowdloans && ownCrowdloans[0];
    const ownCrowdloanRaised = (ownCrowdloan && ownCrowdloan.raised) || 0;

    // Our crowdloan does not exist yet, or has already won then no incentives apply
    if (!ownCrowdloan || (ownCrowdloan && ownCrowdloan.status == "Won")) return;

    const currentAuction = ((await Auction.getByOngoing(true)) || [])[0];
    const currentAuctionId = (currentAuction && currentAuction.id) || "0";

    // if current auction is not target auction - 1 or newer, no incentives apply
    if (parseInt(currentAuctionId) < (parseInt(targetAuctionId) - 1)) return;

    const siblingCrowdloanCandidates = (await getSiblingCrowdloanCandidates()) || [];
    const siblingBidCandidates = (await getSiblingBidCandidatesByAuctionId(currentAuctionId)) || [];

    const ownCrowdloanStartBlockNum = ownCrowdloan.blockNum || 0;

    // Once we've gathered sibling parachain candidates, we can calculate incentives relative to our own valuation
    const calculateFinalIncentives = calculateIncentives(
        blockNum, 
        siblingCrowdloanCandidates, 
        siblingBidCandidates, 
        ownCrowdloanRaised,
        ownCrowdloanStartBlockNum,
        currentAuction,
        isSignificant
    );

    /**
     * If we're not in the target auction yet, consider the second largest crowdloan/bid
     * this is due to the first crowdloan/bid winning the prior auction, and not being
     * a competitor anymore in the auction we're targeting
     */
    if (parseInt(currentAuctionId) < parseInt(targetAuctionId)) {
        await calculateFinalIncentives(1)
    } else {
        // We're in the target auction, or in an auction after the target auction
        await calculateFinalIncentives(0)
    }
}