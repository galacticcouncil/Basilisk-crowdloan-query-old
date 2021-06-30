import { incentives as incentivesConfig } from '../../constants'
import linearScale from 'simple-linear-scale'

export const calculateBsxMultiplier = (
    currentBlockNum, 
    isRightBeforeTargetAuction,
    currentAuctionClosingStart,
    currentAuctionClosingEnd,
) => {
    // if we're in targetAuctionId - 1, return full bsx multiplier
    if (isRightBeforeTargetAuction) return incentivesConfig.bsx.scale.rewardMultiplier.min;
    
    /**
     * Linear scale used to determine the reward multiplier
     * resulting from a range of possible lead percentage diffs.
     */
    const bsxMultiplierScale = linearScale(
        [
            currentAuctionClosingStart,
            currentAuctionClosingEnd
        ],
        [
            incentivesConfig.bsx.scale.rewardMultiplier.min,
            incentivesConfig.bsx.scale.rewardMultiplier.max
        ]
    )
    
    const isAuctionClosing = currentBlockNum >= currentAuctionClosingStart;
    // if the auction is not closing, return the full bsx multiplier
    if (!isAuctionClosing) return incentivesConfig.bsx.scale.rewardMultiplier.min
    
    /**
     * If the auction is closing, calculate the multipler on a scale
     * from currentAuctionClosingStart to currentAuctionClosingEnd
     * using the currentBlockNum
     */
    return bsxMultiplierScale(currentBlockNum)
}