export const ChronicleKey = 'ChronicleKey';

export const incentives = {
    hdx: {
      scale: {
        leadPercentageDiff: {
          min: 0,
          max: 0.1
        },
        /**
         * Lower the absoulute lead percentage diff, higher the reward
         */
        rewardMultiplier: {
          min: 0.3,
          max: 0.05
        }
      }
    },
    bsx: {
        scale: {
          rewardMultiplier: {
            min: 1,
            max: 0,
            // separate configuration for no incentives
            // in case that the minimal bsx multiplier won't be 0
            // if the incentive program changes
            none: 0
          }
        }
    }
  };