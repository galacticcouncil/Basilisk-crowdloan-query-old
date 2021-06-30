import { expect } from 'chai'
import { calculateBsxMultiplier } from '../src/handlers/incentives/calculateBsxMultiplier'
import BigNumber from 'bignumber.js'

describe('calculateBsxMultiplier', () => {
    
    // starting the auction at block 10
    const currentAuctionClosingStart = 12;
    const currentAuctionClosingEnd = 17;

    describe('auction right before target auction', () => {
        const isRightBeforeTargetAuction = true;
        it('should output the maximum reward, if the current auction is right before the target auction', () => {

            const blocksBeforeClosing = [7, 8, 9];
            blocksBeforeClosing.forEach(blockNum => {
                const bsxMultiplier = calculateBsxMultiplier(
                    blockNum,
                    isRightBeforeTargetAuction,
                    currentAuctionClosingStart,
                    currentAuctionClosingEnd
                );
                expect(bsxMultiplier).to.be.eq(1)
            })
        })
    })
    
    describe('auction not closing', () => {
        const isRightBeforeTargetAuction = false;
        it('should output the maximum reward, if the auction is not closing yet', () => {
            /**
             * NOTE: currentAuctionClosingStart = 12, and if the currentBlockNum is 12,
             * the multiplier scale returns the full multiplier = 1.
             * 
             * To avoid this, add `currentAuctionClosingStart - 1` to the bsxMultiplierScale
             */
            const blocksBeforeClosing = [10, 11, 12];
            blocksBeforeClosing.forEach(blockNum => {
                const bsxMultiplier = calculateBsxMultiplier(
                    blockNum,
                    isRightBeforeTargetAuction,
                    currentAuctionClosingStart,
                    currentAuctionClosingEnd
                );
                expect(bsxMultiplier).to.be.eq(1)
            })
        })
    })

    describe('auction closing', () => {
        const isRightBeforeTargetAuction = false;
        it('should output the maximum reward, if the auction is not closing yet', () => {
            const blocksBeforeClosing = [13, 14, 15];
            blocksBeforeClosing.forEach(blockNum => {
                const bsxMultiplier = calculateBsxMultiplier(
                    blockNum,
                    isRightBeforeTargetAuction,
                    currentAuctionClosingStart,
                    currentAuctionClosingEnd
                );
                expect(bsxMultiplier).to.be.lessThan(1)
                expect(bsxMultiplier).to.be.greaterThan(0)
            })
        })
    })
});