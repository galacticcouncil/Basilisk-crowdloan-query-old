import { expect } from 'chai'
import { calculateHdxMultiplier } from '../src/handlers/incentives/calculateHdxMultiplier'
import BigNumber from 'bignumber.js'

describe('calculateHdxMultiplier', () => {

    describe('auction closing', () => {
        it('should output the minimal reward multiplier, if our own auction is winning by 10% or more', () => {
            const siblingAuctionRaised = new BigNumber("90");
            const ownAuctionRaised = new BigNumber("100");
            const hdxMultiplier = calculateHdxMultiplier(siblingAuctionRaised, ownAuctionRaised);
            expect(hdxMultiplier).to.be.eq(0.05);
        })
    
        it('should output a medium reward multiplier, if our own auction is winning only by 5%', () => {
            const siblingAuctionRaised = new BigNumber("95");
            const ownAuctionRaised = new BigNumber("100");
            const hdxMultiplier = calculateHdxMultiplier(siblingAuctionRaised, ownAuctionRaised);
            expect(hdxMultiplier).to.be.eq(0.175);
        })
    
        it('should output the maximum reward multiplier, if our own auction is on par with the sibling auction', () => {
            const siblingAuctionRaised = new BigNumber("100");
            const ownAuctionRaised = new BigNumber("100");
            const hdxMultiplier = calculateHdxMultiplier(siblingAuctionRaised, ownAuctionRaised);
            expect(hdxMultiplier).to.be.eq(0.3);
        })
    
        it('should output the maximum reward multiplier, if our own auction loosing compared to the sibling auction', () => {
            const siblingAuctionRaised = new BigNumber("101");
            const ownAuctionRaised = new BigNumber("100");
            const hdxMultiplier = calculateHdxMultiplier(siblingAuctionRaised, ownAuctionRaised);
            expect(hdxMultiplier).to.be.eq(0.3);
        })
    })

})



